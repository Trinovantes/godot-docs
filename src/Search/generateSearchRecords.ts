import assert from 'node:assert'
import type { SearchRecord } from './SearchRecord.ts'
import { DocCache } from '../DocCache.ts'
import { RstBulletList, RstEnumeratedList, RstNode, RstParagraph, RstSection, RstToHtmlCompiler } from '../rstCompiler.ts'
import { MAX_INDEX_TEXT_LENGTH } from '../Constants.ts'

export function generateSearchRecords(): Array<SearchRecord> {
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
            docHierarchy[`lvl${node.level}`] = node.textContent

            // Clear global hierachy of any headings beyond node.level
            for (let i = node.level + 1; i <= 6; i++) {
                assertSectionLevel(i)
                delete docHierarchy[`lvl${i}`]
            }

            const record: SearchRecord = {
                objectID: `${htmlPath}#${htmlAttrResolver.getNodeHtmlId(node)}`,
                hierarchy: structuredClone(docHierarchy),
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
