<template>
    <header class="layout-navbar">
        <div class="navbar-left">
            <el-button text :icon="collapsed ? Expand : Fold" @click="$emit('toggle')" />
            <Breadcrumb />
        </div>
        <div class="navbar-right">
            <el-tag type="success" effect="light">已登录</el-tag>
            <el-dropdown>
                <button class="user-trigger" type="button">
                    <span class="avatar">{{ initial }}</span>
                    <span>{{ userName }}</span>
                </button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item disabled>角色 {{ roles.join(', ') || '-' }}</el-dropdown-item>
                        <el-dropdown-item divided @click="$emit('logout')">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Expand, Fold } from '@element-plus/icons-vue';
import Breadcrumb from './Breadcrumb.vue';

const props = defineProps<{
    collapsed: boolean;
    userName: string;
    roles: string[];
}>();

defineEmits<{
    toggle: [];
    logout: [];
}>();

const initial = computed(() => props.userName.slice(0, 1).toUpperCase() || 'A');
</script>
