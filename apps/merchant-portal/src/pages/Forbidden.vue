<template>
    <div class="page forbidden-page">
        <el-result icon="warning" title="403" :sub-title="t('forbidden.subtitle')">
            <template #extra>
                <el-button v-if="homePath !== '/403'" type="primary" @click="router.push(homePath)">
                    {{ t('forbidden.backHome') }}
                </el-button>
            </template>
        </el-result>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';
import { firstAvailableMenuPath } from '@/utils/menu';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const homePath = computed(() => firstAvailableMenuPath(auth.session?.menus || []));
</script>
