import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { getVitepressNavgroups } from '../src/VitePressConfig/getVitepressNavGroups.ts'
import { getVitepressSidebars } from '../src/VitePressConfig/getVitepressSidebars.ts'
import { DocCache } from '../src/DocCache.ts'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, ALGOLIA_SEARCH_INDEX, WEBSITE_BASE_PATH, MARKDOWN_DIR } from '../src/Constants.ts'
import { wrapImageInFigureTagPlugin } from './plugins/wrapImageInFigureTag.ts'

const docCache = new DocCache()
const themeNav = getVitepressNavgroups(docCache)
const themeSidebar = getVitepressSidebars(docCache)

export default defineConfig({
    title: 'Godot',
    srcDir: path.resolve(MARKDOWN_DIR),
    base: WEBSITE_BASE_PATH,
    ignoreDeadLinks: true,

    markdown: {
        html: true,
        config: (md) => {
            md.use(tabsMarkdownPlugin)
            md.use(wrapImageInFigureTagPlugin)
        },
    },

    vite: {
        ssr: {
            noExternal: [
                'vitepress-plugin-tabs',
            ],
        },
    },

    themeConfig: {
        nav: themeNav,
        sidebar: themeSidebar,

        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/trinovantes/godot-docs',
            },
        ],

        editLink: {
            text: 'Official Doc',
            pattern: ({ filePath }) => {
                return `https://docs.godotengine.org/en/stable/${filePath.replace('.md', '.html')}`
            },
        },

        search: {
            provider: 'algolia',
            options: {
                appId: ALGOLIA_APP_ID,
                apiKey: ALGOLIA_SEARCH_API_KEY,
                indexName: ALGOLIA_SEARCH_INDEX,
            },
        },
    },

    transformPageData: (pageData) => {
        const showPrevNextBtns = !pageData.filePath.endsWith('/index.md') && pageData.filePath !== 'index.md'
        const canonicalUrl = `https://docs.godotengine.org/en/stable/${pageData.relativePath}`
            .replace(/index\.md$/, '')
            .replace(/\.md$/, '.html')

        return {
            frontmatter: {
                prev: showPrevNextBtns,
                next: showPrevNextBtns,
                head: [
                    [
                        'link',
                        {
                            rel: 'canonical',
                            href: canonicalUrl,
                        },
                    ],
                ],
            },
        }
    },

    buildEnd: async ({ srcDir, outDir }) => {
        const srcFilePaths = await fg(['_downloads/**/*'], { cwd: srcDir, absolute: true })

        for (const srcFilePath of srcFilePaths) {
            const destFilePath = srcFilePath.replace(srcDir, outDir)
            fs.mkdirSync(path.dirname(destFilePath), { recursive: true })
            fs.copyFileSync(srcFilePath, destFilePath)
        }
    },
})
