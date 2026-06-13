<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('error.missingView') }}</h1>

            </div>
        </div>
        <el-alert
            type="warning"
            show-icon
            :closable="false"
            :title="$t('error.missingHint')"
            :description="$t('error.missingDetail')"
        />
        <el-descriptions :column="1" border style="margin:16px 0">
            <el-descriptions-item :label="$t('error.routePath')">{{ route.fullPath }}</el-descriptions-item>
            <el-descriptions-item :label="$t('error.componentConfig')">
                {{ route.meta.configuredComponent || $t('error.notConfigured') }}
            </el-descriptions-item>
            <el-descriptions-item :label="$t('error.suggestCreate')">
                {{ route.meta.expectedView || expectedView }}
            </el-descriptions-item>
        </el-descriptions>
        <el-button type="primary" size="small" @click="router.push('/dashboard')">{{ $t('error.backWorkspace') }}</el-button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const expectedView = computed(() => {
    const normalizedPath = route.path.replace(/^\/+/, '').replace(/\/$/, '') || 'dashboard';
    return `src/views/${normalizedPath}/index.vue`;
});
</script>
