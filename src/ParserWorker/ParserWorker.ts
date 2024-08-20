import path from 'node:path'
import { RstNodeJson, RstParserOptions } from '../rstCompiler.js'

// ----------------------------------------------------------------------------
// MARK: Response
// ----------------------------------------------------------------------------

export const enum ParserWorkerResponseType {
    READY,
    TERMINATED,
    PARSE_RESULT,
    PARSE_ERROR,
}

export type ParserWorkerResponse = {
    type: ParserWorkerResponseType.READY
} | {
    type: ParserWorkerResponseType.TERMINATED
} | {
    type: ParserWorkerResponseType.PARSE_RESULT
    filePath: string
    timeMs: number
    rootJson: RstNodeJson
    directives: Array<string>
    roles: Array<string>
} | {
    type: ParserWorkerResponseType.PARSE_ERROR
    filePath: string
    error: Error
}

// ----------------------------------------------------------------------------
// MARK: Request
// ----------------------------------------------------------------------------

export const enum ParserWorkerRequestType {
    TERMINATE,
    PARSE_JOB,
}

export type ParserWorkerRequest = {
    type: ParserWorkerRequestType.TERMINATE
} | {
    type: ParserWorkerRequestType.PARSE_JOB
    filePath: string
    fileContents: string
    parserOptions?: Partial<RstParserOptions>
}

// ----------------------------------------------------------------------------
// MARK: Worker
// ----------------------------------------------------------------------------

const WORKER_SCRIPT = path.join(__dirname, 'ParserWorkerScript.ts')

export class ParserWorker extends Worker {
    constructor(
        public readonly id: number,
        public readonly idStr: string,
    ) {
        super(WORKER_SCRIPT)
    }

    dispatchJob(job?: [string, string], parserOptions?: Partial<RstParserOptions>): void {
        let msg: ParserWorkerRequest

        if (job) {
            msg = {
                type: ParserWorkerRequestType.PARSE_JOB,
                filePath: job[0],
                fileContents: job[1],
                parserOptions,
            }
        } else {
            msg = {
                type: ParserWorkerRequestType.TERMINATE,
            }
        }

        this.postMessage(msg)
    }

    override toString(): string {
        return `ParserWorker ${this.idStr}`
    }
}
