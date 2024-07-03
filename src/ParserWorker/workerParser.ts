import { RstNodeType, RstToMdCompiler } from '../rstCompiler.js'
import { ParserWorkerRequest, ParserWorkerRequestType, ParserWorkerResponse, ParserWorkerResponseType } from './ParserWorker'

// For ts to recognize this file as Worker
declare let self: Worker

function postResult(msg: ParserWorkerResponse & { type: ParserWorkerResponseType.PARSE_RESULT }) {
    postMessage(msg)
    postReady()
}

function postTerminated() {
    postMessage({ type: ParserWorkerResponseType.TERMINATED } satisfies ParserWorkerResponse)
}

function postReady() {
    postMessage({ type: ParserWorkerResponseType.READY } satisfies ParserWorkerResponse)
}

self.addEventListener('message', (event: MessageEvent<ParserWorkerRequest>) => {
    switch (event.data.type) {
        case ParserWorkerRequestType.TERMINATE: {
            postTerminated()
            process.exit(0)
            break
        }

        case ParserWorkerRequestType.PARSE_JOB: {
            const t0 = performance.now()
            const { filePath, fileContents, parserOptions } = event.data
            const compiler = new RstToMdCompiler()
            const parserOutput = compiler.parse(fileContents, parserOptions)
            const t1 = performance.now()

            const root = parserOutput.root
            const directives = root.findAllChildren(RstNodeType.Directive).map((node) => node.directive)
            const roles = root.findAllChildren(RstNodeType.InterpretedText).map((node) => node.role)

            postResult({
                type: ParserWorkerResponseType.PARSE_RESULT,
                timeMs: t1 - t0,
                filePath,
                rootJson: root.toJSON(),
                directives,
                roles,
            })
            break
        }
    }
})

postReady()
