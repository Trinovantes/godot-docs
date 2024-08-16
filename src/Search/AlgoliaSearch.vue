<script lang="ts" setup>
import '@docsearch/css'
import { onKeyStroke } from '@vueuse/core'
import { ref } from 'vue'
import AlgoliaSearchBox from './AlgoliaSearchBox.vue'

function isEditingContent(event: KeyboardEvent): boolean {
    const element = event.target as HTMLElement
    const tagName = element.tagName

    return (
        element.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'SELECT' ||
        tagName === 'TEXTAREA'
    )
}

const isDialogOpen = ref(false)
const searchDialogRef = ref<HTMLDialogElement | null>(null)
const searchBtnRef = ref<HTMLButtonElement | null>(null)

const showSearchDialog = () => {
    searchBtnRef.value?.blur()
    isDialogOpen.value = true
    searchDialogRef.value?.showModal()
}

const closeSearchDialog = () => {
    isDialogOpen.value = false
    searchDialogRef.value?.close()
}

onKeyStroke('k', (event) => {
    if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        showSearchDialog()
    }
})
onKeyStroke('/', (event) => {
    if (!isEditingContent(event)) {
        event.preventDefault()
        showSearchDialog()
    }
})
</script>

<template>
    <div class="VPNavBarSearch">
        <dialog
            ref="searchDialogRef"
            class="DocSearch-Modal"
            @click="(event) => {
                if (event.target === searchDialogRef) {
                    closeSearchDialog()
                }
            }"
        >
            <AlgoliaSearchBox
                :is-open="isDialogOpen"
                @close="closeSearchDialog()"
            />
        </dialog>

        <button
            ref="searchBtnRef"
            type="button"
            class="DocSearch DocSearch-Button"
            @click="showSearchDialog()"
        >
            <span class="vp-icon DocSearch-Search-Icon" />
            Search
        </button>
    </div>
</template>

<style lang="scss" scoped>
.VPNavBarSearch{
    display: flex;
    flex: 1;

    .DocSearch-Button{
        background-color: var(--vp-c-bg-alt);
        border: 1px solid transparent;
        justify-content: start;
        gap: 8px;
        border-radius: 8px;

        width: 100%;
        height: 40px;
    }

    :deep(.DocSearch-Search-Icon){
        --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' stroke-width='1.6' viewBox='0 0 20 20'%3E%3Cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' d='m14.386 14.386 4.088 4.088-4.088-4.088A7.533 7.533 0 1 1 3.733 3.733a7.533 7.533 0 0 1 10.653 10.653z'/%3E%3C/svg%3E");
    }

    dialog{
        border: none;
        padding: 0;
        max-width: unset;
    }
}
</style>
