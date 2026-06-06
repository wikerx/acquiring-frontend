<template>
    <section class="page">
        <div class="page-hero">
            <div>
                <span class="eyebrow">Operations Console</span>
                <h1>管理后台控制台</h1>
                <p>支付收单平台的商户、交易、权限和基础数据运营视图。</p>
            </div>
            <el-tag effect="dark" type="success">在线</el-tag>
        </div>
        <div class="metric-grid">
            <el-card shadow="never">
                <span>当前账号</span>
                <strong>{{ auth.session?.account.loginAccount }}</strong>
                <small>{{ auth.session?.account.realName || '平台管理员' }}</small>
            </el-card>
            <el-card shadow="never">
                <span>权限数量</span>
                <strong>{{ auth.session?.permissions.length || 0 }}</strong>
                <small>来自 service-admin RBAC</small>
            </el-card>
            <el-card shadow="never">
                <span>菜单目录</span>
                <strong>{{ catalogCount }}</strong>
                <small>后端菜单树驱动</small>
            </el-card>
            <el-card shadow="never">
                <span>功能菜单</span>
                <strong>{{ menuCount }}</strong>
                <small>按角色授权展示</small>
            </el-card>
        </div>
        <div class="dashboard-panels">
            <el-card shadow="never">
                <template #header>安全控制</template>
                <div class="security-row">
                    <el-tag>JWT 登录态</el-tag>
                    <el-tag type="success">菜单权限</el-tag>
                    <el-tag type="warning">接口权限</el-tag>
                    <el-tag type="info">操作审计</el-tag>
                </div>
            </el-card>
            <el-card shadow="never">
                <template #header>快捷入口</template>
                <div class="quick-links">
                    <el-button
                        v-for="item in quickLinks"
                        :key="item.path"
                        plain
                        @click="$router.push(item.path)"
                    >
                        {{ item.label }}
                    </el-button>
                </div>
            </el-card>
        </div>
    </section>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import type { AuthMenu } from '@acquiring/shared';
    import { useAuthStore } from '@/stores/authStore';

    const auth = useAuthStore();
    const flatMenus = computed(() => flattenMenus(auth.session?.menus || []));
    const catalogCount = computed(
        () => flatMenus.value.filter((menu) => menu.menuType === 'CATALOG').length,
    );
    const menuCount = computed(() => flatMenus.value.filter((menu) => menu.menuType === 'MENU').length);
    const quickLinks = computed(() =>
        flatMenus.value
            .filter((menu) => menu.routePath && menu.menuType === 'MENU')
            .slice(0, 6)
            .map((menu) => ({ label: menu.menuName, path: menu.routePath || '/dashboard' })),
    );

    function flattenMenus(menus: AuthMenu[]): AuthMenu[] {
        return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children || [])]);
    }
</script>
