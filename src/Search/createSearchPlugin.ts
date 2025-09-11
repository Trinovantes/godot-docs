import path from 'node:path'
import type { Plugin } from 'vite'

const searchComponent = path.resolve(import.meta.dirname, 'AlgoliaSearch.vue')

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
