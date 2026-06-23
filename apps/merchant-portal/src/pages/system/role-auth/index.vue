<template>
    <div class="page system-page">
        <el-result title="角色授权已合并到角色管理" sub-title="请在角色管理列表中点击“授权”，或在新增、编辑角色时直接维护菜单与功能权限。">
            <template #extra>
                <el-button type="primary" size="small" @click="goRoleManage">进入角色管理</el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

function goRoleManage() {
    router.replace('/system/role');
}

onMounted(() => {
    window.setTimeout(goRoleManage, 800);
});
</script>
