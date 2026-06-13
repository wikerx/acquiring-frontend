<template>
    <header class="layout-navbar">
        <div class="navbar-left">
            <el-button v-if="showCollapse !== false" text :icon="collapsed ? Expand : Fold" @click="$emit('toggle')" />
            <Breadcrumb />
        </div>
        <div class="navbar-right">
            <LanguageSwitch />
            <!-- Settings -->
            <el-tooltip :content="$t('settings.title')" effect="dark" placement="bottom">
                <el-button text circle :icon="Setting" @click="settingsPanelRef?.open()" />
            </el-tooltip>
            <!-- Fullscreen toggle -->
            <el-tooltip :content="isFullscreen ? $t('layout.exitFullscreen') : $t('layout.fullscreen')" effect="dark">
                <el-button text circle :icon="FullScreen" @click="toggleFullscreen" />
            </el-tooltip>
            <!-- User dropdown -->
            <el-dropdown trigger="click">
                <button class="user-trigger" type="button">
                    <span class="avatar">{{ initial }}</span>
                    <span>{{ userName }}</span>
                </button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item disabled>
                            <el-icon><UserFilled /></el-icon>
                            {{ userName }}
                        </el-dropdown-item>
                        <el-dropdown-item disabled>
                            <span style="font-size:12px;color:#909399">{{ $t('layout.roles') }}: {{ roles.join(', ') || '-' }}</span>
                        </el-dropdown-item>
                        <el-dropdown-item divided @click="$emit('logout')">
                            <el-icon><SwitchButton /></el-icon>
                            {{ $t('layout.logout') }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <SettingsPanel ref="settingsPanelRef" />
    </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Expand, Fold, FullScreen, Setting, UserFilled, SwitchButton } from '@element-plus/icons-vue';
import Breadcrumb from './Breadcrumb.vue';
import LanguageSwitch from '@/components/LanguageSwitch/index.vue';
import SettingsPanel from '@/components/SettingsPanel/index.vue';

const settingsPanelRef = ref<InstanceType<typeof SettingsPanel>>();

const props = defineProps<{
    collapsed: boolean;
    userName: string;
    roles: string[];
    showCollapse?: boolean;
}>();

defineEmits<{
    toggle: [];
    logout: [];
}>();

const initial = computed(() => props.userName.slice(0, 1).toUpperCase() || 'A');
const isFullscreen = ref(false);

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        isFullscreen.value = true;
    } else {
        document.exitFullscreen();
        isFullscreen.value = false;
    }
}
</script>
