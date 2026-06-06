<template>
    <section class="page">
        <h1>{{ title }}</h1>
        <el-empty description="后端业务接口接入后在此补充列表、筛选和操作。" />
    </section>
</template>

<script setup lang="ts">
    defineProps<{
        title: string;
    }>();
</script>
