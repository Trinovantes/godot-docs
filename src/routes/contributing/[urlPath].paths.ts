import { getDocFiles } from '../../getDocFiles'

export default {
    async paths() {
        const files = await getDocFiles('./docs/contributing')
        return files.map(({ urlPath, fileContents }) => ({
            params: { urlPath },
            content: fileContents,
        }))
    },
}
