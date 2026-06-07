<template>
    <div class="admin-layout">
        <Sidebar :menus="permission.menus" :collapsed="app.sidebarCollapsed" />
        <section class="layout-main" :class="{ expanded: app.sidebarCollapsed }">
            <Navbar
                :collapsed="app.sidebarCollapsed"
                :user-name="user.userInfo?.realName || user.userInfo?.username || 'Admin'"
                :roles="user.roles"
                @toggle="app.toggleSidebar"
                @logout="handleLogout"
            />
            <TagsView :tags="tags.visitedViews" @close="handleCloseTag" />
            <main class="layout-content">
                <RouterView />
            </main>
        </section>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/layout/components/Navbar.vue';
import Sidebar from '@/layout/components/Sidebar.vue';
import TagsView from '@/layout/components/TagsView.vue';
import { useAppStore, usePermissionStore, useTagsViewStore, useUserStore } from '@/store';

const app = useAppStore();
const permission = usePermissionStore();
const tags = useTagsViewStore();
const user = useUserStore();
const route = useRoute();
const router = useRouter();

watch(
    () => route.fullPath,
    () => {
        if (route.path !== '/login') {
            tags.addView({ path: route.path, title: String(route.meta.title || '未命名') });
        }
    },
    { immediate: true },
);

async function handleLogout() {
    await user.logout();
    await router.push('/login');
}

function handleCloseTag(path: string) {
    tags.removeView(path);
    if (route.path === path) {
        const latest = tags.visitedViews[tags.visitedViews.length - 1];
        router.push(latest?.path || '/dashboard');
    }
}
</script>
