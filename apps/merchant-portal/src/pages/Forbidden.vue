<template>
    <div class="page forbidden-page">
        <el-result icon="warning" title="403" :sub-title="t('forbidden.subtitle')">
            <template #extra>
                <el-button type="primary" @click="$router.push('/dashboard')">{{ t('forbidden.backHome') }}</el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
