<template>
    <el-breadcrumb separator="/">
        <el-breadcrumb-item>管理后台</el-breadcrumb-item>
        <el-breadcrumb-item v-for="item in matched" :key="item.path">
            {{ item.meta.title }}
        </el-breadcrumb-item>
    </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const matched = computed(() => route.matched.filter((item) => item.meta.title));
</script>
