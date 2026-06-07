<template>
    <PageContainer title="403" category="访问受限" description="当前账号缺少访问该页面的权限。">
        <el-button type="primary" @click="$router.push('/dashboard')">返回首页</el-button>
    </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';
</script>
