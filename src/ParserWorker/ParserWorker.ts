import path from 'node:path'
import { RstNodeJson, RstParserOptions } from '../rstCompiler.js'

// ----------------------------------------------------------------------------
// MARK: Response
// ----------------------------------------------------------------------------

export const enum ParserWorkerResponseType {
    READY,
    TERMINATED,
    PARSE_RESULT,
    GENERATE_RESULT,
}

export type ParserWorkerResponse = {
    type: ParserWorkerResponseType.READY
} | {
    type: ParserWorkerResponseType.TERMINATED
} | {
    type: ParserWorkerResponseType.PARSE_RESULT
    timeMs: number
    filePath: string
    rootJson: RstNodeJson
    directives: Array<string>
    roles: Array<string>
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

const WORKER_SCRIPT = path.join(__dirname, 'workerParser.ts')

export class ParserWorker extends Worker {
    constructor(
        public readonly id: number,
        public readonly idStr: string,
    ) {
        super(WORKER_SCRIPT)
    }

    dispatchTerminate(): void {
        this.postMessage({ type: ParserWorkerRequestType.TERMINATE } satisfies ParserWorkerRequest)
    }

    dispatchJob(job?: [string, string], parserOptions?: Partial<RstParserOptions>): void {
        if (!job) {
            this.dispatchTerminate()
            return
        }

        this.postMessage({
            type: ParserWorkerRequestType.PARSE_JOB,
            filePath: job[0],
            fileContents: job[1],
            parserOptions,
        } satisfies ParserWorkerRequest)
    }

    override toString(): string {
        return `ParserWorker ${this.idStr}`
    }
}
