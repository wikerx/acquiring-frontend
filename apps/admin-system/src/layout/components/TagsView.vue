<template>
    <div class="tags-workspace" :class="{ google: tagsViewStyle === 'google' }">
        <el-dropdown trigger="click" @command="navigate">
            <button type="button" class="workspace-button pinned-button">
                <el-icon><Lock /></el-icon>
                <span>{{ t('layout.pinned') }}</span>
                <strong>{{ pinnedTags.length }}</strong>
                <el-icon class="workspace-caret"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item
                        v-for="tag in pinnedTags"
                        :key="tag.path"
                        :command="tag.path"
                        :class="{ 'is-active-tag': tag.path === route.path }"
                    >
                        <el-icon v-if="tag.icon"><component :is="resolveMenuIcon(tag.icon)" /></el-icon>
                        {{ titleOf(tag) }}
                    </el-dropdown-item>
                    <el-dropdown-item v-if="!pinnedTags.length" disabled>
                        {{ t('layout.noPinnedTabs') }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <button
            type="button"
            class="workspace-icon-button"
            :aria-label="t('layout.previousTabs')"
            @click="scrollTabs(-1)"
        >
            <el-icon><ArrowLeft /></el-icon>
        </button>

        <div ref="scrollerRef" class="tags-view" :class="{ google: tagsViewStyle === 'google' }" @scroll="scheduleMeasure">
            <button
                v-for="tag in tags"
                :key="tag.path"
                :ref="(element) => setTagElement(tag.path, element)"
                type="button"
                class="tags-view-item"
                :class="{ active: tag.path === route.path, pinned: tag.pinned }"
                :title="titleOf(tag)"
                @click="navigate(tag.path)"
                @contextmenu.prevent="openContextMenu($event, tag)"
            >
                <el-icon v-if="tag.pinned" class="tag-pin"><Lock /></el-icon>
                <el-icon v-else-if="tag.icon" class="tag-icon"><component :is="resolveMenuIcon(tag.icon)" /></el-icon>
                <span class="tag-title">{{ titleOf(tag) }}</span>
                <el-icon v-if="!tag.pinned" class="tag-close" @click.stop="emit('close', tag.path)">
                    <Close />
                </el-icon>
            </button>
        </div>

        <button
            type="button"
            class="workspace-icon-button"
            :aria-label="t('layout.nextTabs')"
            @click="scrollTabs(1)"
        >
            <el-icon><ArrowRight /></el-icon>
        </button>

        <el-dropdown trigger="click" :disabled="hiddenTags.length === 0" @command="navigate">
            <button type="button" class="workspace-button more-tabs-button" :disabled="hiddenTags.length === 0">
                <span>{{ t('layout.moreTabs') }}</span>
                <strong v-if="hiddenTags.length">+{{ hiddenTags.length }}</strong>
                <el-icon><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item
                        v-for="tag in hiddenTags"
                        :key="tag.path"
                        :command="tag.path"
                        :class="{ 'is-active-tag': tag.path === route.path }"
                    >
                        <el-icon v-if="tag.icon"><component :is="resolveMenuIcon(tag.icon)" /></el-icon>
                        {{ titleOf(tag) }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <el-popover v-model:visible="searchVisible" placement="bottom-end" :width="320" trigger="click" @show="focusSearch">
            <template #reference>
                <button type="button" class="workspace-button search-button">
                    <el-icon><Search /></el-icon>
                    <span>{{ t('layout.searchOpenedFunctions') }}</span>
                </button>
            </template>
            <div class="tab-search-panel">
                <el-input
                    ref="searchInputRef"
                    v-model="searchKeyword"
                    :placeholder="t('layout.searchOpenedFunctions')"
                    clearable
                    :prefix-icon="Search"
                />
                <button
                    v-for="tag in matchedTags"
                    :key="tag.path"
                    type="button"
                    class="tab-search-result"
                    :class="{ active: tag.path === route.path }"
                    @click="navigateFromSearch(tag.path)"
                >
                    <el-icon v-if="tag.icon"><component :is="resolveMenuIcon(tag.icon)" /></el-icon>
                    <span>{{ titleOf(tag) }}</span>
                    <el-icon v-if="tag.pinned"><Lock /></el-icon>
                </button>
                <div v-if="!matchedTags.length" class="tab-search-empty">{{ t('layout.noMatchingTabs') }}</div>
            </div>
        </el-popover>

        <span class="workspace-separator" />

        <button type="button" class="workspace-button action-button" :disabled="!canCloseOthers" @click="emit('closeOthers', route.path)">
            <el-icon><CopyDocument /></el-icon>
            <span>{{ t('layout.closeOthers') }}</span>
        </button>
        <button type="button" class="workspace-button action-button" :disabled="!canCloseRight" @click="emit('closeRight', route.path)">
            <el-icon><ArrowRight /></el-icon>
            <span>{{ t('layout.closeRight') }}</span>
        </button>

        <el-dropdown trigger="click" @command="handleAction">
            <button type="button" class="workspace-button action-button">
                <el-icon><MoreFilled /></el-icon>
                <span>{{ t('layout.moreActions') }}</span>
            </button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item :command="activeTag?.pinned ? 'unpin' : 'pin'" :disabled="!activeTag || activeTag.path === '/dashboard'">
                        <el-icon><component :is="activeTag?.pinned ? Unlock : Lock" /></el-icon>
                        {{ activeTag?.pinned ? t('layout.unpinCurrent') : t('layout.pinCurrent') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="closeCurrent" :disabled="!activeTag || activeTag.pinned">
                        {{ t('layout.closeCurrent') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="closeLeft" :disabled="!canCloseLeft">{{ t('layout.closeLeft') }}</el-dropdown-item>
                    <el-dropdown-item command="closeRight" :disabled="!canCloseRight">{{ t('layout.closeRight') }}</el-dropdown-item>
                    <el-dropdown-item command="closeOthers" :disabled="!canCloseOthers">{{ t('layout.closeOthers') }}</el-dropdown-item>
                    <el-dropdown-item command="closeAll" divided :disabled="!hasClosableTags">{{ t('layout.closeAll') }}</el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <div
            v-if="contextVisible"
            class="tag-context-menu"
            :style="{ left: contextX + 'px', top: contextY + 'px' }"
        >
            <button type="button" class="context-item" @click="toggleContextPin">
                {{ contextTag?.pinned ? t('layout.unpinCurrent') : t('layout.pinCurrent') }}
            </button>
            <button v-if="!contextTag?.pinned" type="button" class="context-item" @click="closeContextCurrent">
                {{ t('layout.closeCurrent') }}
            </button>
            <button type="button" class="context-item" @click="closeContextLeft">{{ t('layout.closeLeft') }}</button>
            <button type="button" class="context-item" @click="closeContextRight">{{ t('layout.closeRight') }}</button>
            <button type="button" class="context-item" @click="closeContextOthers">{{ t('layout.closeOthers') }}</button>
            <button type="button" class="context-item context-danger" @click="closeContextAll">{{ t('layout.closeAll') }}</button>
        </div>
        <div v-if="contextVisible" class="context-mask" @click="contextVisible = false" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { InputInstance } from 'element-plus';
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Close,
    CopyDocument,
    Lock,
    MoreFilled,
    Search,
    Unlock,
} from '@element-plus/icons-vue';
import type { VisitedView } from '@/store/modules/tagsView';
import { resolveMenuIcon } from '@/utils/menu-icon';

const props = defineProps<{
    tags: VisitedView[];
    tagsViewStyle?: 'card' | 'google';
}>();

const emit = defineEmits<{
    close: [path: string];
    closeLeft: [path: string];
    closeRight: [path: string];
    closeOthers: [path: string];
    closeAll: [];
    pin: [path: string];
    unpin: [path: string];
}>();

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const scrollerRef = ref<HTMLElement>();
const searchInputRef = ref<InputInstance>();
const searchVisible = ref(false);
const searchKeyword = ref('');
const tagElements = new Map<string, HTMLElement>();
const hiddenPaths = ref<string[]>([]);
const contextVisible = ref(false);
const contextX = ref(0);
const contextY = ref(0);
const contextTag = ref<VisitedView>();
let resizeObserver: ResizeObserver | undefined;
let measureFrame = 0;

const pinnedTags = computed(() => props.tags.filter((tag) => tag.pinned));
const activeTag = computed(() => props.tags.find((tag) => tag.path === route.path));
const activeIndex = computed(() => props.tags.findIndex((tag) => tag.path === route.path));
const hiddenTags = computed(() => props.tags.filter((tag) => hiddenPaths.value.includes(tag.path)));
const hasClosableTags = computed(() => props.tags.some((tag) => !tag.pinned));
const canCloseLeft = computed(() => props.tags.some((tag, index) => index < activeIndex.value && !tag.pinned));
const canCloseRight = computed(() => props.tags.some((tag, index) => index > activeIndex.value && !tag.pinned));
const canCloseOthers = computed(() => props.tags.some((tag) => tag.path !== route.path && !tag.pinned));
const matchedTags = computed(() => {
    const keyword = searchKeyword.value.trim().toLocaleLowerCase();
    if (!keyword) return props.tags;
    return props.tags.filter((tag) => titleOf(tag).toLocaleLowerCase().includes(keyword));
});

function titleOf(tag: VisitedView) {
    const routeKey = `route.${tag.titleKey || ''}`;
    return tag.titleKey && te(routeKey) ? t(routeKey) : tag.title;
}

function setTagElement(path: string, element: Element | ComponentPublicInstance | null) {
    if (element instanceof HTMLElement) {
        tagElements.set(path, element);
    } else {
        tagElements.delete(path);
    }
}

function navigate(path: string) {
    void router.push(path);
}

function navigateFromSearch(path: string) {
    searchVisible.value = false;
    searchKeyword.value = '';
    navigate(path);
}

function scrollTabs(direction: -1 | 1) {
    scrollerRef.value?.scrollBy({ left: direction * 280, behavior: 'smooth' });
}

function measureHiddenTags() {
    const scroller = scrollerRef.value;
    if (!scroller) return;
    const viewport = scroller.getBoundingClientRect();
    hiddenPaths.value = props.tags
        .filter((tag) => {
            const element = tagElements.get(tag.path);
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            return rect.left < viewport.left + 1 || rect.right > viewport.right - 1;
        })
        .map((tag) => tag.path);
}

function scheduleMeasure() {
    if (measureFrame) cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measureHiddenTags);
}

function centerActiveTag() {
    tagElements.get(route.path)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    scheduleMeasure();
}

function focusSearch() {
    nextTick(() => searchInputRef.value?.focus());
}

function emitPinAction(tag: VisitedView) {
    if (tag.pinned) {
        emit('unpin', tag.path);
    } else {
        emit('pin', tag.path);
    }
}

function handleAction(command: string) {
    const path = route.path;
    if (command === 'pin' && activeTag.value) emit('pin', path);
    if (command === 'unpin' && activeTag.value) emit('unpin', path);
    if (command === 'closeCurrent') emit('close', path);
    if (command === 'closeLeft') emit('closeLeft', path);
    if (command === 'closeRight') emit('closeRight', path);
    if (command === 'closeOthers') emit('closeOthers', path);
    if (command === 'closeAll') emit('closeAll');
}

function openContextMenu(event: MouseEvent, tag: VisitedView) {
    contextTag.value = tag;
    contextX.value = Math.min(event.clientX, window.innerWidth - 180);
    contextY.value = Math.min(event.clientY, window.innerHeight - 250);
    contextVisible.value = true;
}

function closeContextMenu() {
    contextVisible.value = false;
}

function toggleContextPin() {
    if (contextTag.value && contextTag.value.path !== '/dashboard') emitPinAction(contextTag.value);
    closeContextMenu();
}

function closeContextCurrent() {
    if (contextTag.value) emit('close', contextTag.value.path);
    closeContextMenu();
}

function closeContextLeft() {
    if (contextTag.value) emit('closeLeft', contextTag.value.path);
    closeContextMenu();
}

function closeContextRight() {
    if (contextTag.value) emit('closeRight', contextTag.value.path);
    closeContextMenu();
}

function closeContextOthers() {
    if (contextTag.value) emit('closeOthers', contextTag.value.path);
    closeContextMenu();
}

function closeContextAll() {
    emit('closeAll');
    closeContextMenu();
}

watch(
    () => [props.tags.map((tag) => `${tag.path}:${tag.pinned}`).join('|'), route.path],
    () => nextTick(centerActiveTag),
);

onMounted(() => {
    resizeObserver = new ResizeObserver(scheduleMeasure);
    if (scrollerRef.value) resizeObserver.observe(scrollerRef.value);
    window.addEventListener('resize', scheduleMeasure);
    nextTick(centerActiveTag);
});

onBeforeUnmount(() => {
    if (measureFrame) cancelAnimationFrame(measureFrame);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', scheduleMeasure);
});
</script>

<style scoped>
.tags-workspace {
    display: flex;
    align-items: center;
    gap: 4px;
    box-sizing: border-box;
    height: var(--app-tags-height);
    min-height: var(--app-tags-height);
    padding: 2px 8px;
    border-bottom: 1px solid var(--tags-border);
    background: var(--tags-bg);
    box-shadow: 0 1px 3px rgb(15 23 42 / 5%);
}

.tags-view {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 4px;
    min-width: 80px;
    height: 28px;
    min-height: 0;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: none;
}

.tags-view::-webkit-scrollbar {
    display: none;
}

.workspace-button,
.workspace-icon-button {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 28px;
    padding: 0 9px;
    border: 1px solid #dbe4f0;
    border-radius: 7px;
    color: #475569;
    background: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.18s, color 0.18s, background-color 0.18s;
}

.workspace-icon-button {
    width: 28px;
    padding: 0;
    border-radius: 50%;
}

.workspace-button:hover:not(:disabled),
.workspace-icon-button:hover:not(:disabled) {
    border-color: #a8c4ff;
    color: var(--app-primary);
    background: #f5f8ff;
}

.workspace-button:disabled,
.workspace-icon-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.workspace-button strong {
    min-width: 18px;
    padding: 1px 5px;
    border-radius: 9px;
    color: #fff;
    background: var(--app-primary);
    font-size: 10px;
    line-height: 16px;
    text-align: center;
}

.pinned-button {
    color: var(--app-primary);
    border-color: #bfd1ff;
    background: #f7f9ff;
}

.workspace-caret {
    margin-left: -2px;
}

.workspace-separator {
    width: 1px;
    height: 18px;
    flex: 0 0 1px;
    background: #e2e8f0;
}

.tags-view-item {
    margin: 0;
    height: 26px;
    max-width: 180px;
}

.tags-view-item.pinned {
    border-style: dashed;
}

.tags-workspace.google .tags-view-item {
    height: 26px;
    padding: 0 10px;
    line-height: 26px;
}

.tags-view-item .tag-pin {
    color: inherit;
    font-size: 12px;
}

.search-button {
    min-width: 132px;
    justify-content: flex-start;
}

.tab-search-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tab-search-result {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) 18px;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 34px;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    color: #475569;
    background: transparent;
    text-align: left;
    cursor: pointer;
}

.tab-search-result:hover,
.tab-search-result.active {
    color: var(--app-primary);
    background: #f1f5ff;
}

.tab-search-result span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tab-search-empty {
    padding: 14px 8px;
    color: #94a3b8;
    text-align: center;
}

.tag-context-menu {
    position: fixed;
    z-index: 3000;
    min-width: 150px;
    padding: 5px;
    border: 1px solid #dbe4f0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 14px 36px rgb(15 23 42 / 16%);
}

.context-item {
    display: block;
    width: 100%;
    padding: 7px 10px;
    border: 0;
    border-radius: 5px;
    color: #475569;
    background: transparent;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
}

.context-item:hover {
    color: var(--app-primary);
    background: #f1f5ff;
}

.context-danger {
    color: #dc2626;
}

.context-mask {
    position: fixed;
    inset: 0;
    z-index: 2999;
}

:global(.el-dropdown-menu__item.is-active-tag) {
    color: var(--app-primary);
    background: #f1f5ff;
}

@media (max-width: 1440px) {
    .action-button span,
    .more-tabs-button span,
    .pinned-button > span {
        display: none;
    }

    .search-button {
        min-width: 28px;
        width: 28px;
        padding: 0;
    }

    .search-button span {
        display: none;
    }
}
</style>
