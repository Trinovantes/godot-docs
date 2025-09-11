import { writeFileSync } from 'node:fs'
import { getVitepressNavgroups } from './getVitepressNavGroups.ts'
import { getVitepressSidebars } from './getVitepressSidebars.ts'
import { DocCache } from '../DocCache.ts'
import { VITEPRESS_NAV_FILE_PATH, VITEPRESS_SIDEBAR_FILE_PATH } from '../Constants.ts'

const docCache = new DocCache()
const nav = getVitepressNavgroups(docCache)
const sidebar = getVitepressSidebars(docCache)

console.info('Writing', VITEPRESS_NAV_FILE_PATH)
writeFileSync(VITEPRESS_NAV_FILE_PATH, JSON.stringify(nav, null, 4))

console.info('Writing', VITEPRESS_SIDEBAR_FILE_PATH)
writeFileSync(VITEPRESS_SIDEBAR_FILE_PATH, JSON.stringify(sidebar, null, 4))
