import type { MarkdownRenderer } from 'vitepress'

export function wrapImageInFigureTagPlugin(md: MarkdownRenderer) {
    md.core.ruler.before('linkify', 'image_figures', (state) => {
        // do not process first and last token
        for (let i = 1, l = state.tokens.length; i < (l - 1); ++i) {
            const token = state.tokens[i]

            if (token.type !== 'inline') {
                continue
            }

            // children: image alone, or link_open -> image -> link_close
            if (!token.children || (token.children.length !== 1 && token.children.length !== 3)) {
                continue
            }

            // one child, should be img
            if (token.children.length === 1 && token.children[0].type !== 'image') {
                continue
            }

            // three children, should be image enclosed in link
            if (token.children.length === 3) {
                const [childrenA, childrenB, childrenC] = token.children
                const isEnclosed =
                    childrenA.type !== 'link_open' ||
                    childrenB.type !== 'image' ||
                    childrenC.type !== 'link_close'

                if (isEnclosed) {
                    continue
                }
            }

            // prev token is paragraph open
            if (i !== 0 && state.tokens[i - 1].type !== 'paragraph_open') {
                continue
            }

            // next token is paragraph close
            if (i !== (l - 1) && state.tokens[i + 1].type !== 'paragraph_close') {
                continue
            }

            // We have inline token containing an image only.
            // Previous token is paragraph open.
            // Next token is paragraph close.
            // Lets replace the paragraph tokens with figure tokens.
            const figure = state.tokens[i - 1]
            figure.type = 'figure_open'
            figure.tag = 'figure'
            state.tokens[i + 1].type = 'figure_close'
            state.tokens[i + 1].tag = 'figure'
        }
    })
}
