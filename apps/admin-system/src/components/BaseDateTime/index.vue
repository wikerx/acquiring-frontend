<template>
    <span class="base-date-time">{{ formattedValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';

const props = defineProps<{
    value: string | number | Date | null | undefined;
    sourceTimeZone?: string;
    displayTimeZone?: string;
}>();

const formattedValue = computed(() => {
    return formatDateTimeFromSourceTimeZone(props.value, props.sourceTimeZone, props.displayTimeZone);
});
</script>

<style scoped>
.base-date-time {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}
</style>
