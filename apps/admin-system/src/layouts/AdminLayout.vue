<template>
    <el-container class="app-shell">
        <el-aside width="248px" class="app-sidebar">
            <div class="brand">
                <span class="brand-mark">A</span>
                <div>
                    <strong>Acquiring Admin</strong>
                    <small>Payment Operations</small>
                </div>
            </div>
            <el-menu :default-active="$route.path" router class="sidebar-menu">
                <SidebarMenu :menus="menuTree" />
            </el-menu>
        </el-aside>
        <el-container>
            <el-header class="app-header">
                <div class="header-title">
                    <el-breadcrumb separator="/">
                        <el-breadcrumb-item>管理后台</el-breadcrumb-item>
                        <el-breadcrumb-item>{{ $route.meta.title || '控制台' }}</el-breadcrumb-item>
                    </el-breadcrumb>
                    <span>{{ currentTitle }}</span>
                </div>
                <div class="header-actions">
                    <el-tag type="success" effect="light">已登录</el-tag>
                    <el-dropdown>
                        <button class="account-button" type="button">
                            <span class="avatar">{{ accountName.slice(0, 1).toUpperCase() }}</span>
                            <span>{{ accountName }}</span>
                        </button>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item disabled>
                                    权限 {{ auth.session?.permissions.length || 0 }} 项
                                </el-dropdown-item>
                                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>
            <el-main>
                <RouterView />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { logout } from '@/api/authApi';
    import SidebarMenu from '@/components/SidebarMenu.vue';
    import { useAuthStore } from '@/stores/authStore';

    const route = useRoute();
    const router = useRouter();
    const auth = useAuthStore();
    const menuTree = computed(() => auth.session?.menus || []);
    const accountName = computed(
        () => auth.session?.account.realName || auth.session?.account.loginAccount || 'Admin',
    );
    const currentTitle = computed(() => String(route.meta.title || '控制台'));

    async function handleLogout() {
        await logout().catch(() => undefined);
        auth.clearSession();
        await router.push('/login');
    }
</script>
