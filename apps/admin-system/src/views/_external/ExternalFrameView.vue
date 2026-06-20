<template>
    <div class="external-frame-page">
        <div class="external-frame-toolbar">
            <el-button type="primary" link :disabled="!frameUrl" @click="handleOpenInNewWindow">
                {{ $t('externalMonitor.openInNewWindow') }}
            </el-button>
        </div>
        <el-empty
            v-if="!frameUrl"
            :description="$t('externalMonitor.urlNotConfigured')"
        />
        <el-empty
            v-else-if="loadFailed"
            :description="$t('externalMonitor.loadFailed')"
        />
        <iframe
            v-else
            class="external-frame"
            :src="frameUrl"
            @load="handleLoad"
            @error="handleError"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePermissionStore } from '@/store';
import type { AdminMenuItem } from '@/types/admin';
import { isExternalFrameMenu, openExternalMenu, resolveExternalUrl } from '@/utils/external-menu';

const route = useRoute();
const permissionStore = usePermissionStore();
const { t } = useI18n();

const loadFailed = ref(false);

/**
 * 解析当前路由对应的 iframe 监控地址。
 */
const frameUrl = computed(() => {
    const targetMenu = findMenuByRuntimePath(permissionStore.menus, route.path);
    if (!targetMenu || !isExternalFrameMenu(targetMenu)) {
        return undefined;
    }
    return resolveExternalUrl(targetMenu.routePath);
});

watch(
    () => route.path,
    () => {
        loadFailed.value = false;
    },
    { immediate: true },
);

/**
 * iframe 加载成功后清除错误态。
 */
function handleLoad() {
    loadFailed.value = false;
}

/**
 * iframe 加载失败时显示统一提示。
 */
function handleError() {
    loadFailed.value = true;
}

/**
 * 使用新窗口打开相同地址，便于处理 iframe 安全头限制。
 */
function handleOpenInNewWindow() {
    if (openExternalMenu(frameUrl.value)) {
        return;
    }
    ElMessage.warning(t('externalMonitor.urlNotConfigured'));
}

/**
 * 根据前端运行时路由查找对应菜单。
 *
 * @param menus 当前用户菜单树
 * @param currentPath 当前路由
 * @returns 匹配的菜单
 */
function findMenuByRuntimePath(menus: AdminMenuItem[], currentPath: string): AdminMenuItem | undefined {
    for (const menu of menus) {
        if ((menu as { runtimePath?: string }).runtimePath === currentPath) {
            return menu;
        }
        if (menu.children?.length) {
            const matchedChild = findMenuByRuntimePath(menu.children, currentPath);
            if (matchedChild) {
                return matchedChild;
            }
        }
    }
    return undefined;
}
</script>

<style scoped>
.external-frame-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: calc(100vh - 148px);
    min-height: 560px;
}

.external-frame-toolbar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 4px 0;
}

.external-frame {
    flex: 1;
    width: 100%;
    min-height: 520px;
    border: 0;
    border-radius: 8px;
    background: #fff;
}
</style>
