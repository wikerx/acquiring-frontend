<template>
    <div class="tags-view">
        <el-tag
            v-for="tag in tags"
            :key="tag.path"
            :closable="tag.path !== '/dashboard'"
            :effect="tag.path === $route.path ? 'dark' : 'plain'"
            @click="$router.push(tag.path)"
            @close="$emit('close', tag.path)"
        >
            {{ tag.title }}
        </el-tag>
    </div>
</template>

<script setup lang="ts">
import type { VisitedView } from '@/store/modules/tagsView';

defineProps<{
    tags: VisitedView[];
}>();

defineEmits<{
    close: [path: string];
}>();
</script>
