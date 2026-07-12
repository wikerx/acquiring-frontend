<template>
    <span class="base-date-time">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    value?: string | number | Date | null;
    emptyText?: string;
}>();

const displayValue = computed(() => formatDateTime(props.value, props.emptyText || '-'));

function formatDateTime(value: string | number | Date | null | undefined, emptyText: string) {
    if (value === null || value === undefined || value === '') {
        return emptyText;
    }
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? emptyText : toDateTimeText(value);
    }
    if (typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? emptyText : toDateTimeText(date);
    }
    return value.replace('T', ' ').slice(0, 19);
}

function toDateTimeText(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return [
        date.getFullYear(),
        '-',
        pad(date.getMonth() + 1),
        '-',
        pad(date.getDate()),
        ' ',
        pad(date.getHours()),
        ':',
        pad(date.getMinutes()),
        ':',
        pad(date.getSeconds()),
    ].join('');
}
</script>

<style scoped>
.base-date-time {
    white-space: nowrap;
}
</style>
