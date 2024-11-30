<script lang="ts" setup>
import { onKeyStroke, useScrollLock, debouncedWatch } from '@vueuse/core'
import { inBrowser, useData, useRouter } from 'vitepress'
import { nextTick, onMounted, ref, shallowRef, watch, Ref } from 'vue'
import { SearchRecord, SearchRecordHit } from './SearchRecord'
import { algoliasearch } from 'algoliasearch'
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY } from '../Constants'

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits<{
    close: []
}>()

// ----------------------------------------------------------------------------
// Lock Background Scrolling
// ----------------------------------------------------------------------------

const isLocked = useScrollLock(inBrowser ? document.body : null)
watch(() => props.isOpen, (isOpen) => {
    isLocked.value = isOpen
}, {
    immediate: true,
})

// ----------------------------------------------------------------------------
// Navigation
// ----------------------------------------------------------------------------

const data = useData()
const router = useRouter()
const gotoRecord = (record: SearchRecord) => {
    const url = data.site.value.base + record.objectID
    void router.go(url)
}

// ----------------------------------------------------------------------------
// MARK: Search Input
// ----------------------------------------------------------------------------

const searchInputRef = ref<HTMLInputElement>()
function focusSearchInput() {
    searchInputRef.value?.focus()
}

onMounted(() => {
    focusSearchInput()
})

// ----------------------------------------------------------------------------
// MARK: Search Results
// ----------------------------------------------------------------------------

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY)
const searchQuery = ref('')
const searchResults: Ref<Array<SearchRecordHit>> = shallowRef([])
debouncedWatch(searchQuery, async(newSearchQuery) => {
    if (!newSearchQuery) {
        searchResults.value = []
        return
    }

    const results = await algoliaClient.searchSingleIndex<SearchRecordHit>({
        indexName: 'godot-docs',
        searchParams: {
            query: newSearchQuery,
            hitsPerPage: 8,
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>',
        },
    })

    searchResults.value = results.hits
}, {
    debounce: 250,
})

// ----------------------------------------------------------------------------
// MARK: Keyboard Hotkeys
// ----------------------------------------------------------------------------

const selectedIdx = ref(-1)
const disableMouseOver = ref(false)

const onMouseEnterResult = (idx: number) => {
    if (disableMouseOver.value) {
        return
    }

    selectedIdx.value = idx
}

const onResultFocus = (idx: number) => {
    selectedIdx.value = idx
}

watch(searchResults, (r) => {
    selectedIdx.value = r.length ? 0 : -1
    scrollToSelectedResult()
})

function scrollToSelectedResult() {
    void nextTick(() => {
        const selectedEl = document.querySelector('.result.selected')
        selectedEl?.scrollIntoView({ block: 'nearest' })
    })
}

onKeyStroke('ArrowUp', (event) => {
    event.preventDefault()
    selectedIdx.value--
    if (selectedIdx.value < 0) {
        selectedIdx.value = searchResults.value.length - 1
    }
    disableMouseOver.value = true
    scrollToSelectedResult()
})

onKeyStroke('ArrowDown', (event) => {
    event.preventDefault()
    selectedIdx.value++
    if (selectedIdx.value >= searchResults.value.length) {
        selectedIdx.value = 0
    }
    disableMouseOver.value = true
    scrollToSelectedResult()
})

onKeyStroke('Enter', (event) => {
    if (event.isComposing) {
        return
    }
    if (event.target instanceof HTMLButtonElement && event.target.type !== 'submit') {
        return
    }
    if (event.target instanceof HTMLInputElement && selectedIdx.value < 0) {
        event.preventDefault()
        return
    }

    const selectedResult = searchResults.value.at(selectedIdx.value)
    if (selectedResult) {
        gotoRecord(selectedResult)
        emit('close')
    }
})

onKeyStroke('Escape', () => {
    emit('close')
})
</script>

<template>
    <div class="search-box">
        <header class="DocSearch-SearchBar">
            <form
                class="DocSearch-Form"
                @click="focusSearchInput()"
                @submit.prevent=""
            >
                <label
                    class="DocSearch-MagnifierLabel"
                    for="docsearch-input"
                    id="docsearch-label"
                >
                    <span class="vp-icon DocSearch-Search-Icon" />
                    <span class="DocSearch-VisuallyHiddenForAccessibility">Search</span>
                </label>

                <input
                    v-model="searchQuery"
                    ref="searchInputRef"
                    id="docsearch-input"
                    class="DocSearch-Input"
                    type="search"
                    placeholder="Search"
                >
            </form>
        </header>

        <div
            v-if="!searchQuery"
            class="DocSearch-Dropdown"
        >
            <div class="DocSearch-StartScreen">
                <p class="DocSearch-Help">
                    No search query
                </p>
            </div>
        </div>

        <div
            v-else-if="searchResults.length === 0"
            class="DocSearch-Dropdown"
        >
            <div class="DocSearch-NoResults">
                <div class="DocSearch-Screen-Icon">
                    <svg width="40" height="40" viewBox="0 0 20 20" fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.8c2 3 1.7 7-1 9.7h0l4.3 4.3-4.3-4.3a7.8 7.8 0 01-9.8 1m-2.2-2.2A7.8 7.8 0 0113.2 2.4M2 18L18 2" /></svg>
                </div>
                <p class="DocSearch-Title">
                    No results for "{{ searchQuery }}"
                </p>
            </div>
        </div>

        <div
            v-else
            class="DocSearch-Dropdown"
        >
            <ul>
                <li
                    v-for="(result, idx) in searchResults"
                    :key="result.objectID"
                    :aria-selected="selectedIdx === idx"
                    class="DocSearch-Hit"
                >
                    <a
                        :href="data.site.value.base + result.objectID"
                        @mouseenter="onMouseEnterResult(idx)"
                        @focusin="onResultFocus(idx)"
                        @click="$emit('close')"
                    >
                        <div class="DocSearch-Hit-Container">
                            <div class="DocSearch-Hit-content-wrapper">
                                <div class="DocSearch-Hit-title">
                                    <template
                                        v-for="[key, highlight] in Object.entries(result._highlightResult.hierarchy).filter(([key,]) => /lvl[1-6]/.test(key))"
                                        :key="key"
                                    >
                                        <span v-html="highlight.value" />
                                        <span class="vpi-chevron-right" />
                                    </template>
                                </div>

                                <div
                                    class="DocSearch-Hit-path"
                                >
                                    {{ /(?<filePath>.+)\.html(#.+)?$/.exec(result.objectID)?.groups?.filePath }}
                                </div>
                            </div>
                        </div>
                    </a>
                </li>
            </ul>
        </div>

        <footer class="DocSearch-Footer">
            <div class="credit">
                Search by <a href="https://www.algolia.com" target="_blank" rel="noopener noreferrer"><img src="./AlgoliaLogo.png"></a>
            </div>
        </footer>
    </div>
</template>

<style lang="scss" scoped>
.search-box{
    display: grid;
    gap: 16px;
    width: 63vw;
}

.DocSearch-NoResults{
    svg{
        margin: 0 auto;
    }
}

.DocSearch-Hit{
    .DocSearch-Hit-title{
        display: flex;
        align-items: center;
        gap: 2px;

        .vpi-chevron-right{
            font-size: 0.8rem;
        }

        .vpi-chevron-right:last-child{
            display: none;
        }

        :deep(mark){
            background: none;
            color: var(--docsearch-highlight-color);
            font-style: normal;
            text-decoration: underline;
        }
    }
}

footer{
    .credit{
        display: flex;
        align-items: center;

        img{
            margin-left: 0.5em;
            height: 20px;
        }
    }
}
</style>
