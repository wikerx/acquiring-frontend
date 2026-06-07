<template>
    <el-tag :type="tagType" effect="light">
        {{ label }}
    </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    value: string | number | boolean | null | undefined;
}>();

const statusText: Record<string, string> = {
    ENABLED: '启用',
    DISABLED: '停用',
    LOCKED: '锁定',
    ACTIVE: '生效中',
    INACTIVE: '未生效',
    ROTATING: '轮换中',
    SUCCESS: '成功',
    FAILED: '失败',
};

const label = computed(() => statusText[String(props.value)] || String(props.value ?? '-'));
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
