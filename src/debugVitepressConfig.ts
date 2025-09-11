import { writeFileSync } from 'node:fs'
import { getVitepressNavgroups } from './utils/getVitepressNavGroups.ts'
import { getVitepressSidebars } from './utils/getVitepressSidebars.ts'
import { DocCache } from './DocCache.ts'
import path from 'node:path'

const docCache = new DocCache()
const nav = getVitepressNavgroups(docCache)
const sidebar = getVitepressSidebars(docCache)

writeFileSync(path.join(import.meta.dirname, '.vitepress-nav.json'), JSON.stringify(nav, null, 4))
writeFileSync(path.join(import.meta.dirname, '.vitepress-sidebar.json'), JSON.stringify(sidebar, null, 4))
