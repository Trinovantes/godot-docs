import { parseArgs } from 'node:util'
import { generateSearchRecords } from './Search/generateSearchRecords.ts'
import { analyzeSearchRecords } from './Search/analyzeSearchRecords.ts'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { uploadSearchRecordsToAlgolia } from './Search/uploadSearchRecordsToAlgolia.ts'

const { values } = parseArgs({
    args: process.argv,
    options: {
        upload: {
            type: 'boolean',
        },
    },
    strict: true,
    allowPositionals: true,
})

console.info('Generating Records')
const searchRecords = generateSearchRecords()
writeFileSync(path.join(import.meta.dirname, '.search-index.json'), JSON.stringify(searchRecords, null, 4))

console.info('Analyzing Records')
const analysis = analyzeSearchRecords(searchRecords)
console.table(analysis)

if (values.upload) {
    await uploadSearchRecordsToAlgolia(searchRecords)
}
