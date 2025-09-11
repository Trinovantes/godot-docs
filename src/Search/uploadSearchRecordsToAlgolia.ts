import { algoliasearch } from 'algoliasearch'
import assert from 'node:assert'
import { formatProgress } from '../utils/formatProgress.ts'
import type { SearchRecord } from './SearchRecord.ts'
import { SEARCH_INDEX } from '../Constants.ts'

export async function uploadSearchRecordsToAlgolia(searchRecords: Array<SearchRecord>) {
    const algoliaAppId = process.env.ALGOLIA_APP_ID
    const algoliaApiKey = process.env.ALGOLIA_WRITE_API_KEY
    assert(algoliaAppId)
    assert(algoliaApiKey)

    console.info('Initializing Algolia')
    const client = algoliasearch(algoliaAppId, algoliaApiKey)

    for (const [idx, record] of searchRecords.entries()) {
        console.info(`[${formatProgress(idx + 1, searchRecords.length)}] Uploading ${record.objectID}`)
        await client.saveObject({
            indexName: SEARCH_INDEX,
            body: record,
        })
    }
}
