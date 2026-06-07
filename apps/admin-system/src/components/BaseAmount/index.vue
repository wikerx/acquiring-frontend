<template>
    <span class="amount">{{ formatAmount(value, currency) }}</span>
</template>

<script setup lang="ts">
import { formatAmount } from '@/utils/format';

defineProps<{
    value: string | number | null | undefined;
    currency?: string;
}>();
</script>
