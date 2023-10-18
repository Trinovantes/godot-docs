import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { generator } from '../src/DocsGenerator'
import { VitePressRoute } from '@/VitePressRoute'

export default defineConfig({
    title: 'Godot',
    description: 'A VitePress Site',
    themeConfig: {
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/vuejs/vitepress',
            },
        ],

        nav: generator.getVitePressNav(),
        sidebar: generator.getVitePressSidebar(),

        editLink: {
            pattern: ({ filePath }) => {
                return `https://github.com/godotengine/godot-docs/blob/master/${filePath.replace('.md', '.rst')}`
            },
        },

        lastUpdated: {
            formatOptions: {
                dateStyle: 'medium',
                timeStyle: 'short',
                forceLocale: true,
            },
        },
    },
    markdown: {
        html: true,
        config(md) {
            md.use(tabsMarkdownPlugin)
        },
    },

    transformPageData: (pageData) => {
        const params = (pageData.params as VitePressRoute['params'])
        pageData.title = params.title
        pageData.lastUpdated = params.lastUpdated
    },

    lastUpdated: true,
    srcDir: './src/routes',
})

// TODO transform on classes page layout
// https://github.com/vuejs/vitepress/issues/2888
