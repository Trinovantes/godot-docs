import DefaultTheme from 'vitepress/theme'
import { Theme } from 'vitepress'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import './custom.scss'

export default {
    extends: DefaultTheme,
    enhanceApp: ({ app }) => {
        enhanceAppWithTabs(app)
    },
} satisfies Theme
