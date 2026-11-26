<template>
    <el-select :model-value="modelValue" :placeholder="placeholder || t('alertConfig.platformSearch')" :clearable="clearable"
        :value-on-clear="''" filterable :filter-method="filter" @visible-change="resetFilter" @update:model-value="$emit('update:modelValue', $event)">
        <template #label="{ value, label }">
            <AlertPlatformIdentity :platform="platforms.find((item) => item.code === value)" :fallback="label" compact />
        </template>
        <el-option v-for="item in matchingPlatforms" :key="item.code" :value="item.code" :label="item.name">
            <AlertPlatformIdentity :platform="item" compact />
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AlertPlatform } from '@/api/channel/disputeAlert';
import AlertPlatformIdentity from './AlertPlatformIdentity.vue';

const props = defineProps<{ modelValue: string; platforms: AlertPlatform[]; placeholder?: string; clearable?: boolean }>();
defineEmits<{ 'update:modelValue': [value: string] }>();

const { t } = useI18n();
const search = ref('');
const matchingPlatforms = computed(() => {
    const keyword = search.value.trim().toLocaleLowerCase();
    return props.platforms.filter((item) => [item.name, item.code].some((value) => value.toLocaleLowerCase().includes(keyword)));
});

function filter(value: string) {
    search.value = value;
}

function resetFilter(visible: boolean) {
    if (!visible) search.value = '';
}
</script>
