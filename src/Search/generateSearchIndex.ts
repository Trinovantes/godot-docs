import assert from 'node:assert'
import { algoliasearch } from 'algoliasearch'
import type { SearchRecord, SearchRecordType } from './SearchRecord.ts'
import { RstBulletList, RstEnumeratedList, RstNode, RstParagraph, RstSection, RstToHtmlCompiler } from '../rstCompiler.ts'
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'
import { formatProgress } from '../utils/formatProgress.ts'
import { DocCache } from '../DocCache.ts'
import { ALGOLIA_SEARCH_INDEX, WEBSITE_BASE_PATH, MAX_INDEX_TEXT_LENGTH, SEARCH_INDEX_FILE_PATH } from '../Constants.ts'
import path from 'node:path'

// ----------------------------------------------------------------------------
// MARK: Main
// Run with --upload to upload to algolia servers
// Otherwise outputs index into OUTPUT_FILE
// ----------------------------------------------------------------------------

async function main() {
    const { values } = parseArgs({
        args: process.argv,
        options: {
            upload: {
                type: 'boolean',
            },
        },
        strict: true,
        allowPositionals: true,
    })

    console.info('Generating Records')
    const searchRecords = generateSearchRecords()

    console.info('Analyzing Records')
    const analysis = analyzeSearchRecords(searchRecords)
    console.table(analysis)

    if (!values.upload) {
        console.info('Writing', SEARCH_INDEX_FILE_PATH)
        writeFileSync(SEARCH_INDEX_FILE_PATH, JSON.stringify(searchRecords, null, 4))
        return
    }

    console.info('Initializing Algolia')
    const { client } = initAlgolia()

    for (const [idx, record] of searchRecords.entries()) {
        console.info(`[${formatProgress(idx + 1, searchRecords.length)}] Uploading ${record.objectID}`)
        await client.saveObject({
            indexName: ALGOLIA_SEARCH_INDEX,
            body: record,
        })
    }
}

await main()

// ----------------------------------------------------------------------------
// MARK: Search Records
// ----------------------------------------------------------------------------

function generateSearchRecords(): Array<SearchRecord> {
    const searchRecords = new Array<SearchRecord>()
    const cache = new DocCache()
    const compiler = new RstToHtmlCompiler()

    for (const [docRstPath, rootJson] of cache.docs.entries()) {
        const htmlPath = docRstPath.replace('.rst', '.html')
        const { root, htmlAttrResolver } = compiler.parseJson(rootJson)

        const docHierarchy: SearchRecord['hierarchy'] = {} // Global hierarchy for current doc
        const tryCreateSearchRecord = (node: RstNode): SearchRecord | null => {
            if (!isNodeStartOfNewRecord(node)) {
                return null
            }

            // Update global hierarchy
            assertSectionLevel(node.level)
            const nodeType: SearchRecordType = `lvl${node.level}`
            docHierarchy[nodeType] = node.textContent

            // Clear global hierachy of any headings beyond node.level
            for (let i = node.level + 1; i <= 6; i++) {
                assertSectionLevel(i)
                delete docHierarchy[`lvl${i}`]
            }

            const urlPath = `${htmlPath}#${htmlAttrResolver.getNodeHtmlId(node)}`
            const record: SearchRecord = {
                url: path.join(WEBSITE_BASE_PATH, urlPath),
                objectID: urlPath,
                lang: 'en-US',
                type: nodeType,
                hierarchy: structuredClone(docHierarchy),
                content: null,
            }

            return record
        }

        const registerHeadings = (node: RstNode) => {
            const record = tryCreateSearchRecord(node)
            if (record) {
                searchRecords.push(record)
            }

            for (const child of node.children) {
                registerHeadings(child)
            }
        }

        registerHeadings(root)
    }

    return searchRecords
}

export function getSiblingText(node: RstNode): string {
    const myIdx = node.getMyIndexInParent()
    if (myIdx === null || !node.parent) {
        return ''
    }

    let text = ''
    for (let i = myIdx + 1; i < node.parent.children.length; i++) {
        const sibling = node.parent.children[i]
        if (isNodeStartOfNewRecord(sibling)) {
            break
        }

        // Only get text from desired elements
        if (!isNodeTextIndexable(sibling)) {
            continue
        }

        // Don't exceed record limit
        const siblingText = sibling.textContent
        if (text.length + siblingText.length > MAX_INDEX_TEXT_LENGTH) {
            break
        }

        text += siblingText
    }

    text = text.replaceAll('\n', ' ') // Replace newlines with spaces
    text = text.replaceAll(/[\u{0080}-\u{FFFFF}]/gu, '') // Remove non-ascii characters

    return text
}

function assertSectionLevel(n: number): asserts n is 1 | 2 | 3 | 4 | 5 | 6 {
    assert(n >= 1 && n <= 6)
}

function isNodeStartOfNewRecord(node: RstNode): node is RstSection {
    return node instanceof RstSection && node.level < 2
}

function isNodeTextIndexable(node: RstNode): boolean {
    return node instanceof RstParagraph || node instanceof RstBulletList || node instanceof RstEnumeratedList
}

// ----------------------------------------------------------------------------
// MARK: Analysis
// ----------------------------------------------------------------------------

function analyzeSearchRecords(searchRecords: Array<SearchRecord>) {
    let totalSize = 0
    let maxSize = Number.MIN_SAFE_INTEGER
    let maxRecordId = ''
    let minSize = Number.MAX_SAFE_INTEGER
    let minRecordId = ''

    for (const record of searchRecords) {
        const recordJsonString = JSON.stringify(record)
        const size = recordJsonString.length

        totalSize += size

        if (size > maxSize) {
            maxSize = size
            maxRecordId = record.objectID
        }

        if (size < minSize) {
            minSize = size
            minRecordId = record.objectID
        }
    }

    const toKb = (bytes: number): string => {
        return `${(bytes / 1024).toFixed(2)} KB`
    }

    const count = searchRecords.length
    const avgSize = totalSize / count

    return {
        count,
        totalSize: toKb(totalSize),
        avgSize: toKb(avgSize),
        max: `${toKb(maxSize)} (${maxRecordId})`,
        min: `${toKb(minSize)} (${minRecordId})`,
    }
}

// ----------------------------------------------------------------------------
// MARK: Upload Index
// ----------------------------------------------------------------------------

function initAlgolia() {
    const algoliaAppId = process.env.ALGOLIA_APP_ID
    const algoliaApiKey = process.env.ALGOLIA_WRITE_API_KEY
    assert(algoliaAppId)
    assert(algoliaApiKey)

    const client = algoliasearch(algoliaAppId, algoliaApiKey)

    return {
        client,
    }
}
