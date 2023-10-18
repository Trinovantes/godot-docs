import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { generator } from '../src/DocsGenerator'

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
    },
    markdown: {
        config(md) {
            md.use(tabsMarkdownPlugin)
        },
    },

    cleanUrls: true,
    srcDir: './src/routes',
})
