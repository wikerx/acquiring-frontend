<template>
    <section class="page">
        <div class="page-header">
            <div>
                <span class="eyebrow">{{ moduleMeta.category }}</span>
                <h1>{{ moduleMeta.title }}</h1>
            </div>
            <el-tag :type="hasPermission ? 'success' : 'warning'" effect="light">
                {{ hasPermission ? '已授权' : '未授权' }}
            </el-tag>
        </div>

        <el-form class="search-panel" inline>
            <el-form-item v-for="item in moduleMeta.focus.slice(0, 3)" :key="item" :label="item">
                <el-input disabled placeholder="后端接口接入后启用" />
            </el-form-item>
            <el-form-item>
                <el-button disabled>重置</el-button>
                <el-button disabled type="primary">搜索</el-button>
            </el-form-item>
        </el-form>

        <div class="action-bar">
            <el-button disabled type="primary">新增</el-button>
            <el-button disabled>导出</el-button>
        </div>

        <el-table :data="[]" border stripe empty-text="后端管理接口接入后显示列表数据">
            <el-table-column
                v-for="item in moduleMeta.focus"
                :key="item"
                :label="item"
                min-width="160"
            />
            <el-table-column label="状态" width="120">
                <template #default>
                    <el-tag type="info">待接入</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right" />
        </el-table>

        <div class="module-note">
            <el-alert
                :closable="false"
                type="info"
                show-icon
                :title="moduleMeta.summary"
                :description="`数据来源：${moduleMeta.dataSource}。权限标识：${moduleMeta.permission}。`"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute } from 'vue-router';
    import { getAdminModuleMeta } from '@/config/adminModules';
    import { useAuthStore } from '@/stores/authStore';

    const route = useRoute();
    const auth = useAuthStore();
    const moduleMeta = computed(
        () =>
            getAdminModuleMeta(route.path) || {
                title: String(route.meta.title || '管理模块'),
                category: '管理后台',
                permission: String(route.meta.permission || ''),
                summary: '该管理模块需要后端接口接入后补充。',
                focus: ['查询条件', '列表字段', '操作入口'],
                dataSource: 'service-admin',
            },
    );
    const hasPermission = computed(() => auth.hasPermission(moduleMeta.value.permission));
</script>
