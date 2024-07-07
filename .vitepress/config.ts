import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { getVitepressNavgroups } from '../src/getVitepressNavGroups'
import { getVitepressSidebars } from '../src/getVitepressSidebars'
import { DocCache } from '../src/DocCache'
import implicitFigures from 'markdown-it-image-figures'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { BASE_PATH, MARKDOWN_DIR } from '../src/Constants'
import { pagefindPlugin } from 'vitepress-plugin-pagefind'

const docCache = new DocCache()
const themeNav = getVitepressNavgroups(docCache)
const themeSidebar = getVitepressSidebars(docCache)

export default defineConfig({
    title: 'Godot',
    srcDir: MARKDOWN_DIR,
    base: BASE_PATH,

    markdown: {
        html: true,
        config: (md) => {
            md.use(tabsMarkdownPlugin)
            md.use(implicitFigures)
        },
    },

    vite: {
        plugins: [
            pagefindPlugin(),
        ],
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

    buildEnd: async({ srcDir, outDir }) => {
        const srcFilePaths = await fg(['_downloads/**/*'], { cwd: srcDir, absolute: true })

        for (const srcFilePath of srcFilePaths) {
            const destFilePath = srcFilePath.replace(srcDir, outDir)
            fs.mkdirSync(path.dirname(destFilePath), { recursive: true })
            fs.copyFileSync(srcFilePath, destFilePath)
        }
    },
})
