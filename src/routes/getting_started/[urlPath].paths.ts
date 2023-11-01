import { generator } from '../../DocsGenerator'

export default {
    paths() {
        return generator.getVitePressRoutes('getting_started')
    },
}
