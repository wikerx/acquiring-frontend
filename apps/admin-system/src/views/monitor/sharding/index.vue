<template>
    <div class="app-container" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

/**
 * 分表管理父级目录页。
 *
 * <p>后端菜单会为父级目录生成可访问路由；当前页只负责把目录入口转到默认子页面，
 * 避免目录节点被动态路由兜底到 MissingView。</p>
 */
const router = useRouter();

onMounted(() => {
    router.replace('/monitor/sharding/rules');
});
</script>
