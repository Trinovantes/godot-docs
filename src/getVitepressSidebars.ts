import { RstCompiler, RstDirective, RstNodeType, RstToMdCompiler } from './rstCompiler.js'
import { DefaultTheme } from 'vitepress'
import { DocCache } from './DocCache.js'
import path from 'node:path'
import { getCommonPathPrefix } from './getCommonPathPrefix.js'
import { getTocTreeLabel } from './getTocTreeLabel.js'

export function getVitepressSidebars(docCache: DocCache): DefaultTheme.SidebarMulti {
    const compiler = new RstToMdCompiler()
    const root = docCache.loadDoc(compiler, 'index')
    const tocTrees = root.findAllChildren(RstNodeType.Directive).filter((node) => node.directive === 'toctree')
    const sidebar: Record<string, Array<DefaultTheme.SidebarItem>> = {}

    for (const tocTree of tocTrees) {
        const subIndexFiles = tocTree.rawBodyText
            .split('\n') // Each line in toctree is a filePath
            .filter((line) => line.length > 0) // Some toctrees have blank lines for visual clarity

        if (subIndexFiles.length === 0) {
            const sidebarItems = convertTocTreeToSidebarItems(docCache, compiler, tocTree, '')
            const prefix = getCommonPathPrefix(sidebarItems.map((item) => item.link ?? ''))
            sidebar[prefix] = sidebarItems
        } else {
            for (const rawPath of subIndexFiles) {
                if (rawPath.endsWith('/index')) {
                    const basePath = path.dirname(rawPath)
                    const prefix = basePath === '.' ? '/' : basePath
                    sidebar[prefix] = convertIndexPageToSidebarItems(docCache, compiler, rawPath)
                } else {
                    // Not an index page so we just give it a sidebar with single item
                    // const root = docCache.loadDoc(compiler, rawPath)
                    // const title = root.findFirstChild(RstNodeType.Section)?.textContent ?? rawPath
                    sidebar[rawPath] = []
                }
            }
        }
    }

    // Fallback last so it has lowest match priority
    sidebar['/'] = convertIndexPageToSidebarItems(docCache, compiler, 'index', 0, 1)

    return sidebar
}

function convertTocTreeToSidebarItems(docCache: DocCache, compiler: RstCompiler, tocTree: RstDirective, basePath: string, depth = 0, maxDepth = Number.MAX_SAFE_INTEGER): Array<DefaultTheme.SidebarItem> {
    if (depth > maxDepth) {
        return []
    }

    return tocTree.rawBodyText
        .split('\n') // Each line in toctree is a filePath
        .filter((line) => line.length > 0) // Some toctrees have blank lines for visual clarity
        .map((filePath): DefaultTheme.SidebarItem => {
            const fullPath = path.join(basePath, filePath)
            const childItems = convertIndexPageToSidebarItems(docCache, compiler, fullPath, depth + 1, maxDepth)
            const label = docCache.loadDoc(compiler, fullPath).findFirstChild(RstNodeType.Section)?.textContent ?? fullPath

            if (childItems.length === 0) {
                return {
                    text: label,
                    base: '/',
                    link: fullPath,
                }
            } else if (childItems.length === 1 && childItems[0].text === label) {
                return childItems[0]
            } else {
                return {
                    text: label,
                    base: '/',
                    link: fullPath,
                    items: childItems,
                }
            }
        })
}

function convertIndexPageToSidebarItems(docCache: DocCache, compiler: RstCompiler, filePath: string, depth = 0, maxDepth = Number.MAX_SAFE_INTEGER): Array<DefaultTheme.SidebarItem> {
    if (depth > maxDepth) {
        return []
    }

    const basePath = path.dirname(filePath)
    const root = docCache.loadDoc(compiler, filePath)
    const tocTrees = root.findAllChildren(RstNodeType.Directive).filter((node) => node.directive === 'toctree')

    return tocTrees.map((tocTree) => ({
        text: getTocTreeLabel(tocTree),
        base: '/',
        link: filePath,
        items: convertTocTreeToSidebarItems(docCache, compiler, tocTree, basePath, depth + 1, maxDepth),
    }))
}
