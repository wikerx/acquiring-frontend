<template>
    <PageContainer title="当前页面尚未实现" category="Missing View" description="路由已被兜底处理，应用不会因为页面缺失而白屏。">
        <el-alert
            type="warning"
            show-icon
            :closable="false"
            title="请补充对应业务页面"
            description="如果这是最终菜单页面，请在 src/views 下创建对应 index.vue；如果是历史路径，请补充 redirect。"
        />
        <el-descriptions :column="1" border class="missing-detail">
            <el-descriptions-item label="路由地址">{{ route.fullPath }}</el-descriptions-item>
            <el-descriptions-item label="组件配置">
                {{ route.meta.configuredComponent || '未配置' }}
            </el-descriptions-item>
            <el-descriptions-item label="建议创建">
                {{ route.meta.expectedView || expectedView }}
            </el-descriptions-item>
        </el-descriptions>
        <el-button type="primary" @click="router.push('/dashboard')">返回工作台</el-button>
    </PageContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';

const route = useRoute();
const router = useRouter();

const expectedView = computed(() => {
    const normalizedPath = route.path.replace(/^\/+/, '').replace(/\/$/, '') || 'dashboard';
    return `src/views/${normalizedPath}/index.vue`;
});
</script>

<style scoped>
.missing-detail {
    margin: 16px 0;
}
</style>
