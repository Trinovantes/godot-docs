import path from 'node:path'

export const ALGOLIA_APP_ID = 'AF7QW3H7VS'
export const ALGOLIA_SEARCH_API_KEY = '92ba993c8ad6a6310c7f468ea46a82a7'
export const ALGOLIA_SEARCH_INDEX = 'godot-docs'
export const MAX_INDEX_TEXT_LENGTH = 1024 * 9 // Leave 1 KB for the other record fields

// Assume node.js is executed from root of project
export const RST_DIR = './libs/godot-docs'
export const MARKDOWN_DIR = './.cache'
export const WEBSITE_BASE_PATH = '/godot-docs/'

export const SEARCH_INDEX_FILE_PATH = path.join(import.meta.dirname, '.search-index.json')
export const VITEPRESS_NAV_FILE_PATH = path.join(import.meta.dirname, '.vitepress-nav.json')
export const VITEPRESS_SIDEBAR_FILE_PATH = path.join(import.meta.dirname, '.vitepress-sidebar.json')
