import { DefaultTheme } from 'vitepress'
import { getDisplayName } from './getDisplayName'
import { DocFile } from './getDocFiles'

export function computeNavGroups(files: Array<DocFile>): Array<DefaultTheme.NavItem> {
    const navGroups = new Map<string, Array<DefaultTheme.NavItemWithLink>>()

    for (const { fileRelPath, urlPath, title } of files) {
        const [, navGroupSlug, ...components] = fileRelPath.split('/')

        // Skip root index.rst
        if (navGroupSlug === 'index.rst') {
            continue
        }

        // Only want immediate categories in main nav
        if (!(components[0].endsWith('.rst') || components[1] === 'index.rst')) {
            continue
        }

        // Skip auto-generated classes docs
        if (navGroupSlug === 'classes' && components[0] !== 'index.rst') {
            continue
        }

        if (!navGroups.has(navGroupSlug)) {
            navGroups.set(navGroupSlug, [])
        }

        navGroups.get(navGroupSlug)?.push({
            text: title,
            link: urlPath,
        })
    }

    return [...navGroups.entries()].map(([route, items]) => {
        if (items.length === 1) {
            return {
                text: getDisplayName(route),
                link: items[0].link,
            }
        } else {
            return {
                text: getDisplayName(route),
                items,
            }
        }
    })
}
