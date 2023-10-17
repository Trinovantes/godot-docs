import { defineConfig } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { computeNavGroups } from '../src/computeNavGroups'
import { computeSidebarGroups } from '../src/computeSidebarGroups'
import { getDocFiles } from '../src/getDocFiles'

const files = await getDocFiles('./docs')

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

        nav: computeNavGroups(files),
        sidebar: computeSidebarGroups(files),
    },
    markdown: {
        config(md) {
            md.use(tabsMarkdownPlugin)
        },
    },

    srcDir: './src/routes',
})
