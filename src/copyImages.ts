import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve('./docs')
const publicDir = path.resolve('./src/routes/public')

export function copyImages(srcDir: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true })

    for (const entry of entries) {
        const absPath = path.resolve(srcDir, entry.name)

        if (entry.isDirectory()) {
            copyImages(absPath)
        } else if (isImage(entry.name)) {
            const relPath = absPath.replace(rootDir, '')
            const src = absPath
            const dest = path.join(publicDir, relPath)
            const destDir = path.dirname(dest)
            fs.mkdirSync(destDir, { recursive: true })
            fs.copyFileSync(src, dest)
        }
    }
}

function isImage(fileName: string) {
    return fileName.endsWith('.png') || fileName.endsWith('.gif') || fileName.endsWith('.jpg') || fileName.endsWith('.webp')
}

// TODO makefile for build steps
// 1. copy images
// 2. vitepress build
// 3. copy files?
