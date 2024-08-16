import { writeFileSync } from 'node:fs'
import { getVitepressNavgroups } from './utils/getVitepressNavGroups'
import { getVitepressSidebars } from './utils/getVitepressSidebars'
import { DocCache } from './DocCache.js'
import path from 'node:path'

const docCache = new DocCache()
const nav = getVitepressNavgroups(docCache)
const sidebar = getVitepressSidebars(docCache)

writeFileSync(path.join(__dirname, 'vitepress-nav.json'), JSON.stringify(nav, null, 4))
writeFileSync(path.join(__dirname, 'vitepress-sidebar.json'), JSON.stringify(sidebar, null, 4))
