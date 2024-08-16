import path from 'node:path'
import { Plugin } from 'vite'

const searchComponent = path.resolve(__dirname, 'AlgoliaSearch.vue')

export function createSearchPlugin(): Plugin {
    return {
        name: 'vite-plugin-algolia-search',
        enforce: 'pre',

        config: () => ({
            resolve: {
                alias: {
                    './VPNavBarSearch.vue': searchComponent,
                },
            },
        }),
    }
}
