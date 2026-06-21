<template>
    <div class="admin-layout" :class="{
        'fixed-header': settings.fixedHeader,
        'top-mode': settings.layoutMode === 'top',
    }">
        <Sidebar v-if="settings.layoutMode !== 'top'" :menus="permission.menus" :collapsed="app.sidebarCollapsed" :side-theme="settings.sideTheme" :show-logo="settings.showLogo" />
        <section class="layout-main" :class="{ expanded: app.sidebarCollapsed }">
            <Navbar
                :collapsed="app.sidebarCollapsed"
                :show-collapse="settings.layoutMode !== 'top'"
                :user-name="user.userInfo?.realName || user.userInfo?.username || 'Admin'"
                :login-account="user.userInfo?.username"
                :roles="user.roles"
                :can-view-login-log="user.hasPermission('system:login-log:list')"
                @toggle="app.toggleSidebar"
                @open-login-log="handleOpenLoginLog"
                @logout="handleLogout"
            />
            <TopNav v-if="settings.layoutMode === 'top'" :menus="permission.menus" />
            <TagsView v-if="settings.showTagsView" :tags="tags.visitedViews" :tags-view-style="settings.tagsViewStyle" @close="handleCloseTag" @close-others="handleCloseOthers" @close-all="handleCloseAll" />
            <main class="layout-content">
                <RouterView />
            </main>
            <footer v-if="settings.showFooter" class="layout-footer">
                {{ $t('login.copyright') }}
            </footer>
        </section>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/layout/components/Navbar.vue';
import Sidebar from '@/layout/components/Sidebar.vue';
import TopNav from '@/layout/components/TopNav/index.vue';
import TagsView from '@/layout/components/TagsView.vue';
import { useAppStore, usePermissionStore, useSettingsStore, useTagsViewStore, useUserStore } from '@/store';

const app = useAppStore();
const settings = useSettingsStore();
const permission = usePermissionStore();
const tags = useTagsViewStore();
const user = useUserStore();
const route = useRoute();
const router = useRouter();

watch(
    () => route.fullPath,
    () => {
        if (route.path !== '/login') {
            tags.addView({
                path: route.path,
                title: String(route.meta.title || ''),
                titleKey: route.meta.titleKey as string | undefined,
                icon: typeof route.meta.icon === 'string' ? route.meta.icon : undefined,
            });
        }
    },
    { immediate: true },
);

async function handleLogout() {
    await user.logout();
    await router.push('/login');
}

function handleOpenLoginLog() {
    router.push('/system/log');
}

function handleCloseTag(path: string) {
    tags.removeView(path);
    if (route.path === path) {
        const latest = tags.visitedViews[tags.visitedViews.length - 1];
        router.push(latest?.path || '/dashboard');
    }
}

function handleCloseOthers(path: string) {
    tags.clearOthers(path);
    if (!tags.visitedViews.some((v) => v.path === route.path)) {
        router.push(path);
    }
}

function handleCloseAll() {
    tags.clearAll();
    router.push('/dashboard');
}
</script>
