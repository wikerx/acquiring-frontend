<template>
    <el-tag :type="tagType" effect="light">
        {{ label }}
    </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    value: string | number | boolean | null | undefined;
}>();

const label = computed(() => {
    const key = String(props.value).toLowerCase();
    const map: Record<string, string> = {
        enabled: t('status.enabled'),
        disabled: t('status.disabled'),
        locked: t('status.locked'),
        active: t('status.active'),
        inactive: t('status.inactive'),
        rotating: t('status.rotating'),
        success: t('status.success'),
        failed: t('status.failed'),
    };
    return map[key] || String(props.value ?? '-');
});
const tagType = computed(() => {
    if (props.value === 'ENABLED' || props.value === 'ACTIVE' || props.value === 'SUCCESS') {
        return 'success';
    }
    if (props.value === 'DISABLED' || props.value === 'FAILED') {
        return 'danger';
    }
    if (props.value === 'ROTATING') {
        return 'warning';
    }
    return 'info';
});
</script>
