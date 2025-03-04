import { RstDirective, RstNode } from '../rstCompiler.js'

export function getTocTreeLabel(node: RstDirective): string {
    const caption = node.config?.getField('caption')
    if (caption) {
        return caption
    }

    let prevSibling: RstNode | null = node
    while (prevSibling !== null && prevSibling.nodeType !== 'Section') {
        prevSibling = prevSibling.getPrevSibling()
    }

    if (!prevSibling) {
        throw new Error(`[${node.toShortString()}] Failed to getTocTreeLabel`)
    }

    return prevSibling.textContent
}
