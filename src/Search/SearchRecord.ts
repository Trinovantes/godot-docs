export type SearchRecord = {
    objectID: string
    hierarchy: Partial<{
        lvl1: string
        lvl2: string
        lvl3: string
        lvl4: string
        lvl5: string
        lvl6: string
        text: string
    }>
}

type HighlightResult<T> = {
    value: T
    fullyHighlighted?: boolean
    matchLevel: 'full' | 'none'
    matchedWords: Array<string>
}

export type SearchRecordHit = SearchRecord & {
    _highlightResult: {
        hierarchy: Partial<{
            lvl1: HighlightResult<string>
            lvl2: HighlightResult<string>
            lvl3: HighlightResult<string>
            lvl4: HighlightResult<string>
            lvl5: HighlightResult<string>
            lvl6: HighlightResult<string>
            text: HighlightResult<string>
        }>
    }
}
