<template>
    <el-dialog
        v-model="visible"
        :title="title"
        :width="width"
        destroy-on-close
        append-to-body
    >
        <slot />
        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" @click="$emit('confirm')">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
const visible = defineModel<boolean>({ required: true });

defineProps<{
    title: string;
    width?: string;
}>();

defineEmits<{
    confirm: [];
}>();
</script>
