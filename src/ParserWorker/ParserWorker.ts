import path from 'node:path'
import { RstNodeJson, RstParserOptions } from '../rstCompiler.js'

// ----------------------------------------------------------------------------
// MARK: Response
// ----------------------------------------------------------------------------

export type ParserWorkerResponseType =
    'READY' |
    'TERMINATED' |
    'PARSE_RESULT' |
    'PARSE_ERROR'

export type ParserWorkerResponse = {
    type: 'READY'
} | {
    type: 'TERMINATED'
} | {
    type: 'PARSE_RESULT'
    filePath: string
    timeMs: number
    rootJson: RstNodeJson
    directives: Array<string>
    roles: Array<string>
} | {
    type: 'PARSE_ERROR'
    filePath: string
    error: Error
}

// ----------------------------------------------------------------------------
// MARK: Request
// ----------------------------------------------------------------------------

export type ParserWorkerRequestType =
    'TERMINATE' |
    'PARSE_JOB'

export type ParserWorkerRequest = {
    type: 'TERMINATE'
} | {
    type: 'PARSE_JOB'
    filePath: string
    fileContents: string
    parserOptions?: Partial<RstParserOptions>
}

// ----------------------------------------------------------------------------
// MARK: Worker
// ----------------------------------------------------------------------------

const WORKER_SCRIPT = path.join(__dirname, 'ParserWorkerScript.ts')

export class ParserWorker extends Worker {
    public readonly id: number
    public readonly idStr: string

    constructor(
        id: number,
        idStr: string,
    ) {
        super(WORKER_SCRIPT)
        this.id = id
        this.idStr = idStr
    }

    dispatchJob(job?: [string, string], parserOptions?: Partial<RstParserOptions>): void {
        let msg: ParserWorkerRequest

        if (job) {
            msg = {
                type: 'PARSE_JOB',
                filePath: job[0],
                fileContents: job[1],
                parserOptions,
            }
        } else {
            msg = {
                type: 'TERMINATE',
            }
        }

        this.postMessage(msg)
    }

    override toString(): string {
        return `ParserWorker ${this.idStr}`
    }
}
