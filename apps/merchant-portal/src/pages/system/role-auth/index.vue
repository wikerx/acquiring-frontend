<template>
    <div class="page system-page">
        <el-result :title="t('system.roleAuth.title')" :sub-title="t('system.roleAuth.subtitle')">
            <template #extra>
                <el-button type="primary" size="small" @click="goRoleManage">{{ t('system.roleAuth.action') }}</el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();

function goRoleManage() {
    router.replace('/system/role');
}

onMounted(() => {
    window.setTimeout(goRoleManage, 800);
});
</script>
