import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { parse, HTMLElement } from 'node-html-parser'
import { DefaultTheme } from 'vitepress'
import { VitePressRoute } from './VitePressRoute'
import assert from 'node:assert'

type DocNavGroup = {
    dir: string
    label: string
}

type DocItem = {
    title: string
    urlPath: string | null
    absPath: string | null
    rootNode: HTMLElement | null
    lastUpdated: number | null
    children?: Array<DocItem>
}

export class DocsGenerator {
    readonly rootDir: string
    readonly navGroups: Array<DocNavGroup>
    readonly navGroupItems = new Map<string, Array<DocItem>>()
    readonly docRefs = new Map<string, string>() // maps ref to urlPath

    constructor(dir: string) {
        this.rootDir = path.resolve(dir)
        this.navGroups = [
            // {
            //     dir: 'about',
            //     label: 'About',
            // },
            // {
            //     dir: 'getting_started',
            //     label: 'Getting Started',
            // },
            // {
            //     dir: 'contributing',
            //     label: 'Contributing',
            // },
            {
                dir: 'community',
                label: 'Community',
            },
            // {
            //     dir: 'tutorials',
            //     label: 'Tutorials',
            // },
            // {
            //     dir: 'classes',
            //     label: 'API Reference',
            // },
        ]

        for (const navGroup of this.navGroups) {
            const dir = path.resolve(this.rootDir, navGroup.dir)
            this.navGroupItems.set(navGroup.dir, this.#parseDir(dir))
        }
    }

    #parseDir(dir: string): Array<DocItem> {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        const files = new Array<DocItem>()

        for (const entry of entries) {
            const absPath = path.resolve(dir, entry.name)
            const urlPath = absPath.replace(this.rootDir, '').replace('.rst', '').replace('/index', '')

            if (entry.isDirectory()) {
                const children = this.#parseDir(absPath)
                // Ignore directories without any rst files (usually img dirs)
                if (children.length === 0) {
                    continue
                }

                const indexFileIdx = children.findIndex((child) => child.absPath?.endsWith(`/${entry.name}/index.rst`))
                if (indexFileIdx >= 0) {
                    files.push({
                        ...children[indexFileIdx],
                        children: children.toSpliced(indexFileIdx, 1),
                    })
                } else {
                    files.push({
                        title: getDisplayName(entry.name),
                        urlPath: null,
                        absPath: null,
                        rootNode: null,
                        lastUpdated: null,
                        children,
                    })
                }
            } else if (absPath.endsWith('submitting_to_assetlib.rst')) {
                const lastUpdated = fs.statSync(absPath).mtime.getTime()

                const rst = fs.readFileSync(absPath).toString('utf-8')
                const refs = /\.\. _([\w\-.@]+)/gm.exec(rst)?.slice(1) ?? []
                for (const ref of refs) {
                    assert(!this.docRefs.has(ref), `ref:${ref} already exists`)
                    this.docRefs.set(ref, urlPath)
                }

                const html = execSync(`pandoc --from=rst --to=html ${absPath}`).toString('utf-8')
                const rootNode = parse(html)
                if (shouldIgnoreDoc(rootNode)) {
                    continue
                }

                const title = /([\w\-@+ ().#\\?']+)\s*({#[\w\-.@]+})?\n[=-]+/m.exec(rst)?.[1]?.trim()
                if (!title) {
                    throw new Error(`Failed to parse title for ${absPath}`)
                }

                files.push({
                    title,
                    urlPath,
                    absPath,
                    lastUpdated,
                    rootNode,
                })
            }
        }

        return files.toSorted((a, b) => a.title.localeCompare(b.title))
    }

    getVitePressNav(): Array<DefaultTheme.NavItem> {
        const getNavItems = (docItems: Array<DocItem>): Array<DefaultTheme.NavItem> => {
            const items = new Array<DefaultTheme.NavItem>()

            for (const item of docItems) {
                if (item.urlPath) {
                    items.push({
                        text: item.title,
                        link: item.urlPath,
                    })
                } else {
                    items.push({
                        text: item.title,
                        items: getNavItems(item.children ?? []),
                    })
                }
            }

            return items
        }

        return this.navGroups.map(({ dir, label }) => {
            const navGroupItems = this.navGroupItems.get(dir) ?? []
            return {
                text: label,
                items: getNavItems(navGroupItems),
            }
        })
    }

    getVitePressSidebar(): DefaultTheme.SidebarMulti {
        const getSidebarItems = (docItems: Array<DocItem>): Array<DefaultTheme.SidebarItem> => {
            const items = new Array<DefaultTheme.SidebarItem>()

            for (const item of docItems) {
                const children = getSidebarItems(item.children ?? [])

                items.push({
                    text: item.title,
                    link: item.urlPath ?? undefined,
                    items: children.length > 0
                        ? children
                        : undefined,
                })
            }

            return items
        }

        const sidebar: Record<string, Array<DefaultTheme.SidebarItem>> = {}

        for (const { dir } of this.navGroups) {
            const navGroupItems = this.navGroupItems.get(dir) ?? []
            sidebar[`/${dir}/`] = getSidebarItems(navGroupItems)
        }

        return sidebar
    }

    getVitePressRoutes(dir: string): Array<VitePressRoute> {
        const routes = new Array<VitePressRoute>()
        const findRoutes = (docItems: Array<DocItem>): void => {
            for (const item of docItems) {
                if (item.urlPath) {
                    routes.push({
                        params: {
                            urlPath: item.urlPath.replace(new RegExp(`^/${dir}/`), '/'),
                            title: item.title,
                            lastUpdated: item.lastUpdated ?? undefined,
                        },
                        content: processRawContent(item, this.rootDir),
                    })
                }

                findRoutes(item.children ?? [])
            }
        }

        const navGroupItems = this.navGroupItems.get(dir) ?? []
        findRoutes(navGroupItems)
        return routes
    }
}

export const generator = new DocsGenerator('./docs')

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getDisplayName(name: string): string {
    name = name.replace('.rst', '')

    if (name.length <= 3) {
        name = name.toUpperCase()
    } else {
        name = name
            .split('_')
            .map((part) => {
                if (part.length > 3) {
                    return part[0].toUpperCase() + part.substring(1)
                } else {
                    return part
                }
            })
            .join(' ')
    }

    return name
}

function shouldIgnoreDoc(rootNode: HTMLElement): boolean {
    const children = rootNode.querySelectorAll('> *')

    if (children.length !== 2) {
        return false
    }

    const first = children[0]
    if (!(first instanceof HTMLElement)) {
        return false
    }
    if (first.tagName !== 'H1') {
        return false
    }

    const second = children[1]
    if (!(second instanceof HTMLElement)) {
        return false
    }
    if (second.tagName !== 'DIV') {
        return false
    }
    if (!second.classList.contains('toctree')) {
        return false
    }

    return true
}

function processRawContent(item: DocItem, rootDir: string): string {
    const { rootNode, absPath } = item
    if (!absPath || !rootNode) {
        throw new Error(`Invalid item:${item.title}`)
    }

    for (const tabsContainer of rootNode.querySelectorAll('div.tabs')) {
        tabsContainer.remove() // TODO
    }

    for (const noteContainer of rootNode.querySelectorAll('div.note, div.tip div.warning div.danger')) {
        if (noteContainer.classList.contains('note')) {
            noteContainer.classList.remove('note')
            noteContainer.classList.add('info')
        }

        noteContainer.classList.add('custom-block')
        noteContainer.querySelector('.admonition-title')?.classList.add('custom-block-title')
    }

    const dirPath = path.dirname(absPath).replace(rootDir, '')
    for (const img of rootNode.querySelectorAll('img')) {
        const imgRelPath = img.getAttribute('src')
        if (!imgRelPath) {
            continue
        }

        const imgPath = path.join(dirPath, imgRelPath)
        const imgAlt = img.getAttribute('alt') ?? ''
        const replacement = `\n\n![${imgAlt}](${imgPath})\n\n`

        img.replaceWith(replacement)
    }

    for (const codeTag of rootNode.querySelectorAll('span.title-ref')) {
        codeTag.tagName = 'CODE'
    }

    return rootNode.toString()
}
