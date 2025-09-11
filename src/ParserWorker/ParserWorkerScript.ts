import { parentPort } from 'node:worker_threads'
import { RstToMdCompiler } from '../rstCompiler.ts'
import type { ParserWorkerRequest, ParserWorkerResponse } from './ParserWorker.ts'

function postReady() {
    parentPort?.postMessage({ type: 'READY' } satisfies ParserWorkerResponse)
}

function postResponse(msg: ParserWorkerResponse) {
    parentPort?.postMessage(msg)
}

parentPort?.on('message', (event: ParserWorkerRequest) => {
    switch (event.type) {
        case 'TERMINATE': {
            postResponse({ type: 'TERMINATED' })
            process.exit(0)
            break
        }

        case 'PARSE_JOB': {
            const { filePath, fileContents, parserOptions } = event

            try {
                const t0 = performance.now()
                const compiler = new RstToMdCompiler()
                const parserOutput = compiler.parse(fileContents, parserOptions)
                const t1 = performance.now()

                const root = parserOutput.root
                const directives = root.findAllChildren('Directive').map((node) => node.directive)
                const roles = root.findAllChildren('InterpretedText').map((node) => node.role)

                postResponse({
                    type: 'PARSE_RESULT',
                    filePath,
                    timeMs: t1 - t0,
                    rootJson: root.toJSON(),
                    directives,
                    roles,
                })
            } catch (err) {
                postResponse({
                    type: 'PARSE_ERROR',
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
