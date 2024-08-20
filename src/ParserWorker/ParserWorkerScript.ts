import { RstNodeType, RstToMdCompiler } from '../rstCompiler.js'
import { ParserWorkerRequest, ParserWorkerRequestType, ParserWorkerResponse, ParserWorkerResponseType } from './ParserWorker.js'

// For ts to recognize this file as Worker
declare let self: Worker

function postReady() {
    postMessage({ type: ParserWorkerResponseType.READY } satisfies ParserWorkerResponse)
}

function postResponse(msg: ParserWorkerResponse) {
    postMessage(msg)
}

self.addEventListener('message', (event: MessageEvent<ParserWorkerRequest>) => {
    switch (event.data.type) {
        case ParserWorkerRequestType.TERMINATE: {
            postResponse({ type: ParserWorkerResponseType.TERMINATED })
            process.exit(0)
            break
        }

        case ParserWorkerRequestType.PARSE_JOB: {
            const { filePath, fileContents, parserOptions } = event.data

            try {
                const t0 = performance.now()
                const compiler = new RstToMdCompiler()
                const parserOutput = compiler.parse(fileContents, parserOptions)
                const t1 = performance.now()

                const root = parserOutput.root
                const directives = root.findAllChildren(RstNodeType.Directive).map((node) => node.directive)
                const roles = root.findAllChildren(RstNodeType.InterpretedText).map((node) => node.role)

                postResponse({
                    type: ParserWorkerResponseType.PARSE_RESULT,
                    filePath,
                    timeMs: t1 - t0,
                    rootJson: root.toJSON(),
                    directives,
                    roles,
                })
            } catch (err) {
                postResponse({
                    type: ParserWorkerResponseType.PARSE_ERROR,
                    filePath,
                    error: err instanceof Error
                        ? err
                        : new Error(String(err)),
                })
            } finally {
                postReady()
            }

            break
        }
    }
})

postReady()
