<template>
    <el-drawer
        v-model="visible"
        :title="$t('settings.title')"
        direction="rtl"
        size="300px"
        :modal="false"
        :before-close="handleClose"
        modal-class="settings-drawer-modal"
        class="settings-drawer"
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

            <!-- Navigation Theme -->
            <div class="settings-section">
                <h4>{{ $t('settings.sideTheme') }}</h4>
                <div class="navigation-theme-list">
                    <button
                        v-for="option in NAVIGATION_THEME_OPTIONS"
                        :key="option.key"
                        class="navigation-theme-option"
                        :class="{ active: settings.sideTheme === option.key }"
                        type="button"
                        @click="settings.updateSetting('sideTheme', option.key)"
                    >
                        <span
                            class="navigation-theme-option__preview"
                            :style="{ background: option.previewColors.shell, borderColor: option.previewColors.accent }"
                        >
                            <i :style="{ background: option.previewColors.bar }" />
                            <b :style="{ background: option.previewColors.active }" />
                            <em :style="{ background: option.previewColors.accent }" />
                        </span>
                        <span>{{ $t(option.labelKey) }}</span>
                    </button>
                </div>
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
import { NAVIGATION_THEME_OPTIONS, PRESET_COLORS } from '@/constants/app';

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
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid rgb(15 23 42 / 10%);
    outline: 2px solid transparent;
    outline-offset: 2px;
    transition: border-color 0.2s, transform 0.15s, box-shadow 0.15s, outline-color 0.15s;
}

.theme-color-dot:hover,
.theme-color-dot:focus-visible {
    transform: scale(1.15);
    box-shadow: 0 8px 18px rgb(15 23 42 / 16%);
}

.theme-color-dot.active {
    border-color: #fff;
    outline-color: var(--app-primary);
    transform: scale(1.1);
}

.theme-color-dot.active::after {
    content: '';
    width: 7px;
    height: 11px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg) translateY(-1px);
}

.navigation-theme-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.navigation-theme-option {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    min-height: 46px;
    padding: 6px 8px;
    color: #475467;
    background: linear-gradient(180deg, #fff, #f8fafc);
    border: 1px solid #e1e7ef;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    text-align: left;
    transition: border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.navigation-theme-option:hover,
.navigation-theme-option:focus-visible,
.navigation-theme-option.active {
    color: var(--app-primary);
    border-color: var(--app-primary);
    box-shadow: 0 10px 22px rgba(37, 99, 235, 0.14);
    transform: translateY(-1px);
    outline: none;
}

.navigation-theme-option__preview {
    position: relative;
    display: block;
    width: 42px;
    height: 28px;
    overflow: hidden;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 4px;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.navigation-theme-option__preview i,
.navigation-theme-option__preview b,
.navigation-theme-option__preview em {
    position: absolute;
    display: block;
    content: '';
}

.navigation-theme-option__preview i {
    inset: 0 0 0 10px;
}

.navigation-theme-option__preview b {
    left: 13px;
    top: 8px;
    width: 21px;
    height: 5px;
    border-radius: 999px;
}

.navigation-theme-option__preview em {
    left: 3px;
    top: 5px;
    width: 4px;
    height: 18px;
    border-radius: 999px;
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
