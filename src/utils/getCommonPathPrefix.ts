export function getCommonPathPrefix(links: Array<string>, stopAfterNumSlashes = 1): string {
    if (links.length === 0) {
        return ''
    }
    if (links.length === 1) {
        return links[0]
    }

    const sortedStrs = links.toSorted()
    const firstEl = sortedStrs[0]
    const lastEl = sortedStrs[sortedStrs.length - 1]

    let numSlashes = 0
    let prefix = ''
    for (let i = 0; i < firstEl.length; i++) {
        if (firstEl[i] === '/') {
            numSlashes += 1

            if (numSlashes >= stopAfterNumSlashes) {
                break
            }
        }

        if (firstEl[i] !== lastEl[i]) {
            break
        }

        prefix += firstEl[i]
    }

    return prefix
}
