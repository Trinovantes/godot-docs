export type SearchRecordType = 'lvl1' | 'lvl2' | 'lvl3' | 'lvl4' | 'lvl5' | 'lvl6' | 'text'

export type SearchRecord = {
    url: string
    objectID: string
    type: SearchRecordType
    hierarchy: Partial<Record<SearchRecordType, string>>
    content: null
    lang: 'en-US'
}
