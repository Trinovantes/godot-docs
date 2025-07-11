import fs from 'node:fs'
import path from 'node:path'
import { RstGeneratorInput, RstNodeJson, RstParserOptions, RstToMdCompiler } from './rstCompiler.js'
import { ParserWorker, ParserWorkerResponse } from './ParserWorker/ParserWorker'
import { DocCache } from './DocCache.js'
import { createHighlighter } from 'shiki'
import { formatProgress, padNum } from './utils/formatProgress.js'
import os from 'node:os'
import { BASE_PATH, MARKDOWN_DIR, RST_DIR } from './Constants.js'

// ----------------------------------------------------------------------------
// MARK: Constants
// ----------------------------------------------------------------------------

const RST_DIR_ABS = path.resolve(RST_DIR)
const MARKDOWN_DIR_ABS = path.resolve(MARKDOWN_DIR)

const NUM_THREADS = process.env.CI
    ? 4 // GitHub actions have 4 threads
    : os.cpus().length - 1 // Leave 1 thread for main process

const assetExts = [
    'png',
    'gif',
    'jpg',
    'svg',
    'webp',
    'webm',
    'mp4',
    'ogg',
].join('|')

const isAsset = (fileName: string) => new RegExp(`\\.(${assetExts})$`).test(fileName)
const isRst = (fileName: string) => /\.(rst)$/.test(fileName)

const epilog = `
.. |weblate_widget| image:: https://hosted.weblate.org/widget/godot-engine/godot-docs/287x66-white.png
    :alt: Translation status
    :target: https://hosted.weblate.org/engage/godot-engine/?utm_source=widget
    :width: 287
    :height: 66
`
const parserOptions: Partial<RstParserOptions> = {
    epilog,
    inputIndentSize: 3,
}

const compiler = new RstToMdCompiler()

// ----------------------------------------------------------------------------
// MARK: Main
// ----------------------------------------------------------------------------

async function main() {
    const documents = processDocs()
    const { parsedDocs, directives, roles } = await parseDocs(documents)
    validateDirectivesAndRoles(directives, roles)
    await generateDocs(parsedDocs)
}

await main()

// ----------------------------------------------------------------------------
// MARK: Steps
// ----------------------------------------------------------------------------

/**
 * Step 1:
 *
 * Read everything in original rst docs dir
 * - Copy over assets (images/videos)
 * - Read rst files and store them inside a map
 */
function processDocs(): Map<string, string> {
    const documents = new Map<string, string>()
    const processDocsInDir = (srcDir: string) => {
        const entries = fs.readdirSync(srcDir, { withFileTypes: true })

        for (const entry of entries) {
            const fileAbsPath = path.resolve(srcDir, entry.name)
            const fileRelPath = path.relative(RST_DIR_ABS, fileAbsPath)

            switch (true) {
                case entry.isDirectory(): {
                    processDocsInDir(fileAbsPath)
                    break
                }

                case isAsset(entry.name): {
                    const destPath = path.join(MARKDOWN_DIR_ABS, fileRelPath)
                    copyFileIfNotExists(fileAbsPath, destPath)
                    break
                }

                case isRst(entry.name): {
                    const rstContents = fs.readFileSync(fileAbsPath).toString('utf-8')
                    documents.set(fileRelPath, rstContents)
                    break
                }
            }
        }
    }

    processDocsInDir(RST_DIR_ABS)
    return documents
}

/**
 * Step 2:
 *
 * Parse each document into an AST
 * Since this is the most time consuming part, we distribute each rst file to a separate worker
 *
 * Inside each worker:
 * 1. Request next job
 * 2. (main thread) Returns next unparsed rst
 * 3. Parse result and return JSON
 *
 * Worker repeats 1-3 until it gets poison pill (when main thread's workQueue is empty)
 *
 * Because this process takes a LONG time (~2 min with 12 threads), the results are saved to .cache.json
 * If this file exists, this function tries to parse it and return it instead
 */
async function parseDocs(documents: Map<string, string>): Promise<{
    parsedDocs: ReadonlyMap<string, RstNodeJson>
    directives: Set<string>
    roles: Set<string>
}> {
    const docCache = new DocCache()
    const globalDirectives = new Set<string>()
    const globalRoles = new Set<string>()

    if (docCache.size > 0) {
        return {
            parsedDocs: docCache.docs,
            directives: globalDirectives,
            roles: globalRoles,
        }
    }

    let numTerminatedWorkers = 0
    const workers = new Array<ParserWorker>()
    const workQueue = [...documents.entries()]

    for (let i = 0; i < NUM_THREADS; i++) {
        const id = i + 1
        const idStr = padNum(id, NUM_THREADS, '0')
        const worker = new ParserWorker(id, idStr)
        workers.push(worker)

        worker.addEventListener('message', (msg: MessageEvent<ParserWorkerResponse>) => {
            switch (msg.data.type) {
                case 'READY': {
                    const job = workQueue.shift()
                    worker.dispatchJob(job, parserOptions)
                    break
                }
                case 'TERMINATED': {
                    numTerminatedWorkers += 1
                    console.info(`[${worker.toString()}] (${numTerminatedWorkers}/${NUM_THREADS}) Terminated`)
                    break
                }
                case 'PARSE_RESULT': {
                    const { timeMs, filePath, rootJson, directives, roles } = msg.data
                    docCache.set(filePath, rootJson)
                    setUnion(directives, globalDirectives)
                    setUnion(roles, globalRoles)
                    console.info(`[${worker.toString()}] (${formatProgress(docCache.size, documents.size)}) Parsed "${filePath}" [${timeMs.toFixed(2)}ms]`)
                    break
                }
                case 'PARSE_ERROR': {
                    const { error, filePath } = msg.data
                    console.error(`[${worker.toString()}] Encountered Error while parsing "${filePath}"`)
                    console.error(error)
                    process.exit(1)
                    break
                }
            }
        })
    }

    await waitUntil(() => numTerminatedWorkers === NUM_THREADS)
    docCache.saveCache()

    for (const worker of workers) {
        worker.terminate()
    }

    return {
        parsedDocs: docCache.docs,
        directives: globalDirectives,
        roles: globalRoles,
    }
}

/**
 * Step 3:
 *
 * For each JSON document:
 * 1. Revive back to RstDocument
 * 2. Generate and save output markdown
 * 3. Copy any downloads the document expects to the expected destination inside _downloads dir
 */
async function generateDocs(parsedDocs: ReadonlyMap<string, RstNodeJson>) {
    const highlighter = await createHighlighter({
        langs: ['py', 'js', 'gdscript', 'shell'],
        themes: ['github-light'],
    })

    const t0 = performance.now()
    const docs: RstGeneratorInput['docs'] = [...parsedDocs.entries()].map(([docPath, rootJson]) => ({
        docPath,
        parserOutput: compiler.parseJson(rootJson, parserOptions),
    }))
    const t1 = performance.now()
    console.info(`Parsed JSON [${(t1 - t0).toFixed(2)}ms]`)

    for (const [idx, filePath] of [...parsedDocs.keys()].entries()) {
        const t0 = performance.now()

        const mdDestPath = path.join(MARKDOWN_DIR_ABS, filePath.replace(/\.rst$/, '.md'))
        const generatorOutput = compiler.generate({
            basePath: '/', // Don't use basePath here since any paths in Markdown will get fed to VitePress and get prepended with another basePath
            currentDocPath: filePath,
            docs,
        }, {
            defaultLiteralBlockLanguage: 'gdscript',
            defaultCodeDirectiveLanguage: 'gdscript',
            shiki: {
                theme: 'github-light',
                highlighter,
            },
        })

        createFileDirIfNotExists(mdDestPath)
        fs.writeFileSync(mdDestPath, `${generatorOutput.header}\n\n${postProcessBody(generatorOutput.body)}`)

        for (const download of generatorOutput.downloads) {
            const downloadSrc = path.join(RST_DIR_ABS, download.srcPath)
            const downloadDest = path.join(MARKDOWN_DIR_ABS, download.destPath)
            copyFileIfNotExists(downloadSrc, downloadDest)
        }

        const t1 = performance.now()
        console.info(`[${formatProgress(idx + 1, parsedDocs.size)}] Generated "${mdDestPath}" [${(t1 - t0).toFixed(2)}ms]`)
    }
}

// ----------------------------------------------------------------------------
// MARK: Helpers
// ----------------------------------------------------------------------------

function validateDirectivesAndRoles(directives: Set<string>, roles: Set<string>) {
    const compiler = new RstToMdCompiler()
    const supportedDirectives = new Set(compiler.directiveGenerators.keys())
    const supportedRoles = new Set(compiler.interpretedTextGenerators.keys())
    const usedDirectives = lowercaseSet(directives)
    const usedRoles = lowercaseSet(roles)

    // Remove supported directives/roles from set of used directives/roles
    setSubtract(usedDirectives, supportedDirectives)
    setSubtract(usedRoles, supportedRoles)

    // If we have nothing left, then we have no unsupported directives/roles
    if (usedDirectives.size === 0 && usedRoles.size === 0) {
        return
    }

    // Otherwise we cannot continue to codegen
    if (usedDirectives.size > 0) {
        console.info('Unsupported Directives:', usedDirectives)
    }
    if (usedRoles.size > 0) {
        console.info('Unsupported Roles:', usedRoles)
    }

    throw new Error(`Unsupported directives:${usedDirectives.size} roles:${usedRoles.size}`)
}

function createFileDirIfNotExists(filePath: string) {
    const destDir = path.dirname(filePath)
    if (fs.existsSync(destDir)) {
        return
    }

    fs.mkdirSync(destDir, { recursive: true })
}

function copyFileIfNotExists(srcPath: string, destPath: string) {
    if (fs.existsSync(destPath)) {
        return
    }

    createFileDirIfNotExists(destPath)
    fs.copyFileSync(srcPath, destPath)
}

function waitUntil(pred: () => boolean): Promise<void> {
    return new Promise<void>((resolve) => {
        const timerId = setInterval(() => {
            if (pred()) {
                clearInterval(timerId)
                resolve()
            }
        }, 500)
    })
}

function setUnion<T>(src: Set<T> | Array<T>, dest: Set<T>): void {
    for (const val of src) {
        dest.add(val)
    }
}

function setSubtract<T>(src: Set<T>, toRemove: Set<T>): void {
    for (const val of toRemove) {
        src.delete(val)
    }
}

function lowercaseSet(set: Set<string>): Set<string> {
    const newSet = new Set<string>()

    for (const val of set) {
        newSet.add(val.toLowerCase())
    }

    return newSet
}

function postProcessBody(body: string): string {
    {
        // VitePress does not modify links inside html tags so we need to modify it manually
        body = body.replaceAll(/<a href="\/(.+?)"/gm, `<a href="${BASE_PATH}$1"`)
    }

    {
        // All assets must use relative/absolute paths in VitePress
        // VitePress converts relative image urls if the image tags are originally in markdown (html tags are left as-is)
        // Thus we need to search for any img tags that are not already relative/absolute and converts them to relative paths
        const assetHtmlTagRe = new RegExp(
            '<(?:img|source) src=' + // <img> or <source>
            '"' +
                '(?!' + // Negative lookbehind to exclude valid urls
                    [
                        '\\.[/\\\\]', // Relative path
                        '[/\\\\]', // Absolute path
                        'https:\\/\\/', // Url
                    ].join('|') +
                ')' +
                '(' + // Start capture group
                    '.+?' + // Any char
                    '\\.' + // Dot
                    `(?:${assetExts})` + // Valid extensions
                ')' + // End capture group
            '"',
        )

        body = body.replaceAll(new RegExp(assetHtmlTagRe, 'gm'), '<img src="./$1"')
    }

    {
        // Fix any godot doc specific bugs that are not worth opening a new pull request (technically not bugs since Sphinx heuristically processes them correctly)
        body = body.replaceAll('](fund.godotengine.org)', '](https://fund.godotengine.org)')
    }

    {
        // Remove empty linebreaks in html tags
        body = body.replaceAll(/(?<openTag><\w+(?:\s+[\w-]+=".+")+>)\n\n\s+(?<closeTag><\/\w+>)/g, '$<openTag>$<closeTag>')
    }

    return body
}
