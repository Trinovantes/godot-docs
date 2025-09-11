import type { SearchRecord } from './SearchRecord.ts'

export function analyzeSearchRecords(searchRecords: Array<SearchRecord>) {
    let totalSize = 0
    let maxSize = Number.MIN_SAFE_INTEGER
    let maxRecordId = ''
    let minSize = Number.MAX_SAFE_INTEGER
    let minRecordId = ''

    for (const record of searchRecords) {
        const recordJsonString = JSON.stringify(record)
        const size = recordJsonString.length

        totalSize += size

        if (size > maxSize) {
            maxSize = size
            maxRecordId = record.objectID
        }

        if (size < minSize) {
            minSize = size
            minRecordId = record.objectID
        }
    }

    const toKb = (bytes: number): string => {
        return `${(bytes / 1024).toFixed(2)} KB`
    }

    const count = searchRecords.length
    const avgSize = totalSize / count

    return {
        count,
        totalSize: toKb(totalSize),
        avgSize: toKb(avgSize),
        max: `${toKb(maxSize)} (${maxRecordId})`,
        min: `${toKb(minSize)} (${minRecordId})`,
    }
}
