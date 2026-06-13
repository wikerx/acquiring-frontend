<template>
    <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ $t('layout.adminConsole') }}</el-breadcrumb-item>
        <el-breadcrumb-item v-for="item in matched" :key="item.path">
            {{ $te('route.' + item.meta.titleKey) ? $t('route.' + item.meta.titleKey) : item.meta.title }}
        </el-breadcrumb-item>
    </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const matched = computed(() => route.matched.filter((item) => item.meta.title));
</script>
