import { defineConfig } from 'vitepress'

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
    },

    srcDir: './src/routes',
})
