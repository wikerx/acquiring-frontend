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
    min-width: 148px;
    white-space: nowrap;
}
</style>
