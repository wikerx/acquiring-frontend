<template>
    <el-tooltip v-if="showSearch" :content="$t('common.search')" effect="dark" placement="bottom">
        <el-button :icon="Search" size="small" circle @click="$emit('toggleSearch')" />
    </el-tooltip>
    <el-tooltip v-if="showRefresh" :content="$t('common.refresh')" effect="dark" placement="bottom">
        <el-button :icon="Refresh" size="small" circle @click="$emit('refresh')" />
    </el-tooltip>
</template>

<script setup lang="ts">
import { Search, Refresh } from '@element-plus/icons-vue';

withDefaults(defineProps<{
    showSearch?: boolean;
    showRefresh?: boolean;
}>(), {
    showSearch: true,
    showRefresh: true,
});

defineEmits<{
    toggleSearch: [];
    refresh: [];
}>();
</script>
