<template>
    <span class="base-date-time">{{ formatDateTime(value) }}</span>
</template>

<script setup lang="ts">
import { formatDateTime } from '@/utils/format';

defineProps<{
    value: string | number | Date | null | undefined;
}>();
</script>

<style scoped>
.base-date-time {
    display: inline-block;
    min-width: 148px;
    white-space: nowrap;
}
</style>
