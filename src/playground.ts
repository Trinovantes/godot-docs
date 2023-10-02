import fs from 'node:fs/promises'
import path from 'node:path'

type Route = {
    params: Record<string, string>
    content?: string
}

const rootDir = path.resolve('./src/about')

async function getFilePaths(dir: string): Promise<Array<string>> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    let files = new Array<string>()

    for (const entry of entries) {
        const entryPath = path.resolve(dir, entry.name)

        if (entry.isDirectory() && !entry.name.includes('classes')) {
            files = files.concat(await getFilePaths(entryPath))
        } else if (entryPath.endsWith('.rst')) {
            files.push(entryPath)
        }
    }

    return files
}

async function getRoutes(dir: string): Promise<Array<Route>> {
    const filePaths = await getFilePaths(dir)
    const routes = new Array<Route>()

    for (const filePath of filePaths) {
        const urlPath = filePath.replace(rootDir, '').replace('.rst', '')
        const content = (await fs.readFile(filePath)).toString('utf-8')

        routes.push({
            params: { urlPath },
            content,
        })
    }

    return routes
}

console.log(await getFilePaths('./src'))

// nav: [
//     {
//         text: 'About',
//         link: '/about',
//     },
//     {
//         text: 'Getting Started',
//         link: '/getting-started',
//     },
//     {
//         text: 'Guide',
//         link: '/guide',
//     },
//     {
//         text: 'Class Reference',
//         link: '/classes',
//     },
//     {
//         text: 'Ecosystem',
//         items: [
//             {
//                 text: 'Community',
//                 items: [
//                     {
//                         text: 'Ways to contribute',
//                         link: '/contributing/ways-to-contribute',
//                     },
//                 ],
//             },
//             {
//                 text: 'Contributing',
//                 items: [
//                     {
//                         text: 'Ways to contribute',
//                         link: '/contributing/ways-to-contribute',
//                     },
//                 ],
//             },
//         ],
//     },
// ],

// sidebar: {
//     '/about/': [
//         {
//             text: 'Test',
//             link: '/',
//         },
//     ],
// },
