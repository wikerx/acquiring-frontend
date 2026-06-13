<template>
    <el-drawer
        v-model="visible"
        :title="$t('settings.title')"
        direction="rtl"
        size="300px"
        :before-close="handleClose"
    >
        <div class="settings-body">
            <!-- Theme Color -->
            <div class="settings-section">
                <h4>{{ $t('settings.themeColor') }}</h4>
                <div class="theme-color-list">
                    <span
                        v-for="color in PRESET_COLORS"
                        :key="color"
                        class="theme-color-dot"
                        :class="{ active: settings.themeColor === color }"
                        :style="{ background: color }"
                        @click="handleThemeChange(color)"
                    />
                </div>
            </div>

            <!-- Sidebar Theme -->
            <div class="settings-section">
                <h4>{{ $t('settings.sideTheme') }}</h4>
                <el-radio-group
                    :model-value="settings.sideTheme"
                    size="small"
                    @change="(val: string) => settings.updateSetting('sideTheme', val as 'dark' | 'light')"
                >
                    <el-radio value="light">{{ $t('settings.sideThemeLight') }}</el-radio>
                    <el-radio value="dark">{{ $t('settings.sideThemeDark') }}</el-radio>
                </el-radio-group>
            </div>

            <!-- Layout Mode -->
            <div class="settings-section">
                <h4>{{ $t('settings.layoutMode') }}</h4>
                <el-radio-group
                    :model-value="settings.layoutMode"
                    size="small"
                    @change="(val: string) => settings.updateSetting('layoutMode', val as 'side' | 'top')"
                >
                    <el-radio value="side">{{ $t('settings.layoutSide') }}</el-radio>
                    <el-radio value="top">{{ $t('settings.layoutTop') }}</el-radio>
                </el-radio-group>
            </div>

            <!-- Layout Options -->
            <div class="settings-section">
                <h4>{{ $t('settings.title') }}</h4>
                <div class="settings-switch-row">
                    <span>{{ $t('settings.fixedHeader') }}</span>
                    <el-switch :model-value="settings.fixedHeader" size="small" @change="(val: boolean) => settings.updateSetting('fixedHeader', val)" />
                </div>
                <div class="settings-switch-row">
                    <span>{{ $t('settings.showLogo') }}</span>
                    <el-switch :model-value="settings.showLogo" size="small" @change="(val: boolean) => settings.updateSetting('showLogo', val)" />
                </div>
                <div class="settings-switch-row">
                    <span>{{ $t('settings.showTagsView') }}</span>
                    <el-switch :model-value="settings.showTagsView" size="small" @change="(val: boolean) => settings.updateSetting('showTagsView', val)" />
                </div>
                <div class="settings-switch-row">
                    <span>{{ $t('settings.showFooter') }}</span>
                    <el-switch :model-value="settings.showFooter" size="small" @change="(val: boolean) => settings.updateSetting('showFooter', val)" />
                </div>
            </div>

            <!-- TagsView Style -->
            <div class="settings-section">
                <h4>{{ $t('settings.tagsViewStyle') }}</h4>
                <el-radio-group
                    :model-value="settings.tagsViewStyle"
                    size="small"
                    @change="(val: string) => settings.updateSetting('tagsViewStyle', val as 'card' | 'google')"
                >
                    <el-radio value="card">{{ $t('settings.tagsViewCard') }}</el-radio>
                    <el-radio value="google">{{ $t('settings.tagsViewGoogle') }}</el-radio>
                </el-radio-group>
            </div>

            <!-- Reset -->
            <div class="settings-section">
                <el-button type="danger" plain size="small" @click="handleReset">
                    {{ $t('settings.reset') }}
                </el-button>
            </div>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/store';
import { PRESET_COLORS } from '@/constants/app';

const { t } = useI18n();
const settings = useSettingsStore();

const visible = ref(false);

function open() {
    visible.value = true;
}

function handleClose() {
    visible.value = false;
}

function handleThemeChange(color: string) {
    settings.updateSetting('themeColor', color);
}

async function handleReset() {
    try {
        await ElMessageBox.confirm(t('settings.resetConfirm'), t('settings.reset'), { type: 'warning' });
        settings.resetSettings();
    } catch {
        // cancelled
    }
}

defineExpose({ open });
</script>

<style scoped>
.settings-body {
    padding: 0 4px;
}

.settings-section {
    margin-bottom: 24px;
}

.settings-section h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
}

.theme-color-list {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.theme-color-dot {
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s, transform 0.15s;
}

.theme-color-dot:hover {
    transform: scale(1.15);
}

.theme-color-dot.active {
    border-color: #303133;
    transform: scale(1.1);
}

.settings-switch-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    color: #606266;
}
</style>
