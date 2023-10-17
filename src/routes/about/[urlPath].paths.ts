import { convertRstToMd } from '../../convertRstToMd'
import { getDocFiles } from '../../getDocFiles'

export default {
    async paths() {
        const files = await getDocFiles('./docs/about')
        return files.map(({ urlPath, fileAbsPath }) => ({
            params: { urlPath },
            content: convertRstToMd(fileAbsPath),
        }))
    },
}
