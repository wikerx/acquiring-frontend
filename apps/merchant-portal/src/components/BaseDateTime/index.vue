<template>
    <span class="base-date-time">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';

const props = defineProps<{
    value?: string | number | Date | null;
    emptyText?: string;
    sourceTimeZone?: string;
    displayTimeZone?: string;
}>();

const displayValue = computed(() => {
    const value = formatDateTimeFromSourceTimeZone(props.value, props.sourceTimeZone, props.displayTimeZone);
    return value === '-' ? props.emptyText || '-' : value;
});
</script>

<style scoped>
.base-date-time {
    white-space: nowrap;
}
</style>
