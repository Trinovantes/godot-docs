import { RstNodeType, RstToMdCompiler } from '../rstCompiler.js'
import { DefaultTheme } from 'vitepress'
import path from 'node:path'
import { getCommonPathPrefix } from './getCommonPathPrefix'
import { DocCache } from '../DocCache.js'

export function getVitepressNavgroups(docCache: DocCache): Required<DefaultTheme.Config>['nav'] {
    const navItems = new Array<DefaultTheme.NavItemWithLink | DefaultTheme.NavItemWithChildren>()
    const compiler = new RstToMdCompiler()
    const root = docCache.loadDoc(compiler, 'index')
    const rootTocTrees = root.findAllChildren(RstNodeType.Directive).filter((node) => node.directive === 'toctree')

    for (const tocTree of rootTocTrees) {
        const label = tocTree.config?.getField('caption')
        if (!label) {
            continue
        }

        const navItemPaths = tocTree.rawBodyText
            .split('\n') // Each line in toctree is a filePath
            .filter((line) => line.length > 0) // Some toctrees have blank lines for visual clarity

        if (navItemPaths.length === 1) {
            navItems.push({
                text: label,
                link: navItemPaths[0],
            } satisfies DefaultTheme.NavItemWithLink)
        } else {
            navItems.push({
                text: label,
                activeMatch: '/' + getCommonPathPrefix(navItemPaths.map((filePath) => path.dirname(filePath))),
                items: navItemPaths.map((filePath) => {
                    const root = docCache.loadDoc(compiler, filePath)
                    const docTitle = root.findFirstChild(RstNodeType.Section)?.textContent ?? filePath

                    return {
                        text: docTitle,
                        activeMatch: '/' + filePath.replace(/\/(index)?$/, ''),
                        link: filePath,
                    }
                }),
            } satisfies DefaultTheme.NavItemWithChildren)
        }
    }

    return navItems
}
