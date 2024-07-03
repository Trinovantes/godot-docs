import path from 'node:path'
import fs from 'node:fs'
import { RstCompiler, RstDocument, RstNodeJson } from './rstCompiler.js'

const CACHE_FILE = path.join(__dirname, '.cache.json')

export class DocCache {
    private _docs: Map<string, RstNodeJson>

    constructor() {
        if (!fs.existsSync(CACHE_FILE)) {
            this._docs = new Map()
            return
        }

        const t0 = performance.now()
        const cacheFile = fs.readFileSync(CACHE_FILE).toString('utf-8')
        const cachedJson = JSON.parse(cacheFile) as Array<[string, RstNodeJson]>
        const cachedResults = new Map(cachedJson)
        const t1 = performance.now()

        console.info(`Read Cache [${(t1 - t0).toFixed(2)}ms]`)
        this._docs = cachedResults
    }

    get docs(): ReadonlyMap<string, RstNodeJson> {
        return this._docs
    }

    get size(): number {
        return this._docs.size
    }

    set(filePath: string, rootJson: RstNodeJson): void {
        this._docs.set(filePath, rootJson)
    }

    loadDoc(compiler: RstCompiler, filePath: string): RstDocument {
        if (this._docs.size === 0) {
            throw new Error('Cache is empty')
        }

        if (!filePath.endsWith('.rst')) {
            filePath = `${filePath}.rst`
        }
        if (filePath.startsWith('/')) {
            filePath = filePath.substring(1)
        }

        const rootJson = this._docs.get(filePath)
        if (!rootJson) {
            throw new Error(`Failed to find "${filePath}" in cache`)
        }

        return compiler.parseJson(rootJson).root
    }

    saveCache() {
        fs.writeFileSync(CACHE_FILE, JSON.stringify([...this._docs.entries()]))
    }
}
