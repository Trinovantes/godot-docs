import fs, { readFile } from 'node:fs/promises'
import path from 'node:path'

export type DocFile = {
    fileAbsPath: string
    fileRelPath: string
    fileContents: string
    title: string
    urlPath: string
}

export async function getDocFiles(dir: string, rootDir?: string): Promise<Array<DocFile>> {
    const rootAbsPath = path.resolve(rootDir ?? dir)
    const entries = await fs.readdir(dir, { withFileTypes: true })

    let files = new Array<DocFile>()

    for (const entry of entries) {
        const fileAbsPath = path.resolve(dir, entry.name)
        const fileRelPath = fileAbsPath.replace(rootAbsPath, '')
        const urlPath = fileRelPath.replace('.rst', '').replace('/index', '')

        if (entry.isDirectory()) {
            files = files.concat(await getDocFiles(fileAbsPath, rootDir ?? dir))
        } else if (fileAbsPath.endsWith('.rst')) {
            const fileContents = (await readFile(fileAbsPath)).toString('utf-8')
            const title = /([\w\-@+ ().#\\?']+)\s*({#[\w\-.@]+})?\n[=-]+/m.exec(fileContents)?.[1]?.trim()
            if (!title) {
                console.warn(`Skipping ${fileAbsPath} because there is no title`)
                continue
            }

            files.push({
                fileAbsPath,
                fileRelPath,
                fileContents,
                title,
                urlPath,
            })
        }
    }

    return files.sort((a, b) => a.urlPath.localeCompare(b.urlPath))
}
