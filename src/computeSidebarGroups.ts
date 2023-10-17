import { DefaultTheme } from 'vitepress'
import { DocFile } from './getDocFiles'

type SidebarItem = {
    text: string
    slug: string
    link?: string
    items?: Array<SidebarItem>
}

type SidebarRoot = {
    [navGroupPrefix: string]: Array<SidebarItem>
}

export function computeSidebarGroups(files: Array<DocFile>): SidebarRoot {
    const sidebar: SidebarRoot = {}

    for (const { fileRelPath, urlPath, title } of files) {
        const [, navGroupSlug, ...components] = fileRelPath.split('/')
        const navGroupPrefix = `/${navGroupSlug}/`

        // Skip root index.rst
        if (navGroupSlug === 'index.rst') {
            continue
        }

        if (!(navGroupPrefix in sidebar)) {
            sidebar[navGroupPrefix] = []
        }

        let parent: SidebarItem | null = null
        let parentList = sidebar[navGroupPrefix]

        // Process nested paths
        for (let i = 0; i < components.length - 1; i++) {
            const subParent = parentList.find((item) => item.slug === components[i])
            if (subParent?.items) {
                parent = subParent
                parentList = subParent.items
            } else {
                const subParent = {
                    text: '0xDEADBEEF',
                    slug: components[i],
                    items: [],
                } satisfies SidebarItem
                parentList.push(subParent)

                parent = subParent
                parentList = subParent.items
            }
        }

        if (components.at(-1) === 'index.rst' && parent) { // check if body contains more than just TOC
            parent.text = title
            parent.link = urlPath
        } else {
            parentList.push({
                text: title,
                link: urlPath,
                slug: fileRelPath,
            })
        }
    }

    return sidebar satisfies DefaultTheme.Sidebar
}
