<template>
    <span>{{ formatDateTime(value) }}</span>
</template>

<script setup lang="ts">
import { formatDateTime } from '@/utils/format';

defineProps<{
    value: string | number | Date | null | undefined;
}>();
</script>
