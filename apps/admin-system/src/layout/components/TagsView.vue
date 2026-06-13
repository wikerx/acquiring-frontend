<template>
    <div class="tags-view" :class="{ google: tagsViewStyle === 'google' }">
        <button
            v-for="tag in tags"
            :key="tag.path"
            type="button"
            class="tags-view-item"
            :class="{ active: tag.path === $route.path }"
            @click="$router.push(tag.path)"
            @contextmenu.prevent="openContextMenu($event, tag)"
        >
            <el-icon class="tag-icon"><component :is="resolveIcon(tag.icon)" /></el-icon>
            <span class="tag-title">
            {{ $te('route.' + tag.titleKey) ? $t('route.' + tag.titleKey) : tag.title }}
            </span>
            <el-icon
                v-if="tag.path !== '/dashboard'"
                class="tag-close"
                @click.stop="handleClose(tag.path)"
            >
                <Close />
            </el-icon>
        </button>
        <!-- Right-click context menu -->
        <div
            v-if="contextVisible"
            class="tag-context-menu"
            :style="{ left: contextX + 'px', top: contextY + 'px' }"
        >
            <div class="context-item" @click="closeCurrent">{{ t('layout.closeCurrent') }}</div>
            <div class="context-item" @click="closeOthers">{{ t('layout.closeOthers') }}</div>
            <div class="context-item" @click="closeAll">{{ t('layout.closeAll') }}</div>
        </div>
        <!-- Click-away mask -->
        <div v-if="contextVisible" class="context-mask" @click="contextVisible = false" />
    </div>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    ChatDotRound,
    Close,
    Coin,
    Document,
    Grid,
    House,
    Key,
    Menu,
    Monitor,
    OfficeBuilding,
    Setting,
    Shop,
    Tickets,
    User,
    UserFilled,
} from '@element-plus/icons-vue';
import type { VisitedView } from '@/store/modules/tagsView';
const { t } = useI18n();

const props = defineProps<{
    tags: VisitedView[];
    tagsViewStyle?: 'card' | 'google';
}>();

const emit = defineEmits<{
    close: [path: string];
    closeOthers: [path: string];
    closeAll: [];
}>();

const route = useRoute();
const router = useRouter();
const contextVisible = ref(false);
const contextX = ref(0);
const contextY = ref(0);
const contextTag = ref<VisitedView | null>(null);

function handleClose(path: string) {
    emit('close', path);
}

function openContextMenu(e: MouseEvent, tag: VisitedView) {
    contextTag.value = tag;
    contextX.value = e.clientX;
    contextY.value = e.clientY;
    contextVisible.value = true;
}

function closeCurrent() {
    contextVisible.value = false;
    if (contextTag.value) {
        handleClose(contextTag.value.path);
    }
}

function closeOthers() {
    contextVisible.value = false;
    if (contextTag.value) {
        emit('closeOthers', contextTag.value.path);
    }
}

function closeAll() {
    contextVisible.value = false;
    emit('closeAll');
}

const icons: Record<string, Component> = {
    ChatDotRound,
    Coin,
    Document,
    Grid,
    House,
    Key,
    Menu,
    Monitor,
    OfficeBuilding,
    Setting,
    Shop,
    Tickets,
    User,
    UserFilled,
};

function resolveIcon(name?: string) {
    return name ? icons[name] || Document : House;
}
</script>

<style scoped>
.tag-context-menu {
    position: fixed;
    z-index: 3000;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 4px 0;
    min-width: 100px;
}

.context-item {
    padding: 7px 16px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
}

.context-item:hover {
    background: #f5f7fa;
    color: var(--app-primary);
}

.context-mask {
    position: fixed;
    inset: 0;
    z-index: 2999;
}
</style>
