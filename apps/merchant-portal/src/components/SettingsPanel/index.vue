<template>
    <el-drawer
        v-model="visible"
        :title="$t('settings.title')"
        direction="rtl"
        size="360px"
        :modal="true"
        :close-on-click-modal="true"
        :close-on-press-escape="true"
        :before-close="handleClose"
        modal-class="merchant-settings-drawer-modal"
        class="merchant-settings-drawer"
    >
        <div class="merchant-settings-body">
            <section class="merchant-settings-section">
                <h4>{{ $t('settings.themeColor') }}</h4>
                <div class="merchant-theme-color-list">
                    <button
                        v-for="color in PRESET_COLORS"
                        :key="color"
                        class="merchant-theme-color-dot"
                        :class="{ active: settings.themeColor === color }"
                        :style="{ background: color }"
                        type="button"
                        :aria-label="color"
                        @click="handleThemeChange(color)"
                    />
                </div>
            </section>

            <section class="merchant-settings-section">
                <h4>{{ $t('settings.sideTheme') }}</h4>
                <div class="merchant-navigation-theme-list">
                    <button
                        v-for="option in NAVIGATION_THEME_OPTIONS"
                        :key="option.key"
                        class="merchant-navigation-theme-option"
                        :class="{ active: settings.sideTheme === option.key }"
                        type="button"
                        @click="settings.updateSetting('sideTheme', option.key)"
                    >
                        <span
                            class="merchant-navigation-theme-option__preview"
                            :style="{ background: option.previewColors.shell, borderColor: option.previewColors.accent }"
                        >
                            <i :style="{ background: option.previewColors.bar }" />
                            <b :style="{ background: option.previewColors.active }" />
                            <em :style="{ background: option.previewColors.accent }" />
                        </span>
                        <span>{{ $t(option.labelKey) }}</span>
                    </button>
                </div>
            </section>

            <section class="merchant-settings-section">
                <h4>{{ $t('settings.layoutMode') }}</h4>
                <el-radio-group
                    :model-value="settings.layoutMode"
                    size="small"
                    @change="(val: string | number | boolean | undefined) => settings.updateSetting('layoutMode', val === 'top' ? 'top' : 'side')"
                >
                    <el-radio value="side">{{ $t('settings.layoutSide') }}</el-radio>
                    <el-radio value="top">{{ $t('settings.layoutTop') }}</el-radio>
                </el-radio-group>
            </section>

            <section class="merchant-settings-section">
                <h4>{{ $t('settings.layoutOptions') }}</h4>
                <div class="merchant-settings-switch-row">
                    <span>{{ $t('settings.fixedHeader') }}</span>
                    <el-switch
                        :model-value="settings.fixedHeader"
                        size="small"
                        @change="(val: string | number | boolean) => settings.updateSetting('fixedHeader', Boolean(val))"
                    />
                </div>
                <div class="merchant-settings-switch-row">
                    <span>{{ $t('settings.showLogo') }}</span>
                    <el-switch
                        :model-value="settings.showLogo"
                        size="small"
                        @change="(val: string | number | boolean) => settings.updateSetting('showLogo', Boolean(val))"
                    />
                </div>
                <div class="merchant-settings-switch-row">
                    <span>{{ $t('settings.showTagsView') }}</span>
                    <el-switch
                        :model-value="settings.showTagsView"
                        size="small"
                        @change="(val: string | number | boolean) => settings.updateSetting('showTagsView', Boolean(val))"
                    />
                </div>
                <div class="merchant-settings-switch-row">
                    <span>{{ $t('settings.showFooter') }}</span>
                    <el-switch
                        :model-value="settings.showFooter"
                        size="small"
                        @change="(val: string | number | boolean) => settings.updateSetting('showFooter', Boolean(val))"
                    />
                </div>
            </section>

            <section class="merchant-settings-section">
                <h4>{{ $t('settings.tagsViewStyle') }}</h4>
                <el-radio-group
                    :model-value="settings.tagsViewStyle"
                    size="small"
                    @change="(val: string | number | boolean | undefined) => settings.updateSetting('tagsViewStyle', val === 'google' ? 'google' : 'card')"
                >
                    <el-radio value="card">{{ $t('settings.tagsViewCard') }}</el-radio>
                    <el-radio value="google">{{ $t('settings.tagsViewGoogle') }}</el-radio>
                </el-radio-group>
            </section>

            <section class="merchant-settings-section">
                <el-button type="danger" plain size="small" @click="handleReset">
                    {{ $t('settings.reset') }}
                </el-button>
            </section>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { NAVIGATION_THEME_OPTIONS, PRESET_COLORS } from '@/constants/app';
import { useSettingsStore } from '@/stores/settingsStore';

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
        // User cancelled.
    }
}

defineExpose({ open });
</script>

<style scoped>
.merchant-settings-body {
    padding: 0 4px 10px;
}

.merchant-settings-section {
    margin-bottom: 26px;
}

.merchant-settings-section h4 {
    margin: 0 0 12px;
    color: #253042;
    font-size: 15px;
    font-weight: 800;
}

.merchant-theme-color-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.merchant-theme-color-dot {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: 1px solid rgb(15 23 42 / 10%);
    border-radius: 8px;
    outline: 2px solid transparent;
    outline-offset: 3px;
    cursor: pointer;
    transition: border-color .18s ease, box-shadow .18s ease, outline-color .18s ease, transform .18s ease;
}

.merchant-theme-color-dot:hover,
.merchant-theme-color-dot:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgb(15 23 42 / 16%);
}

.merchant-theme-color-dot.active {
    border-color: #ffffff;
    outline-color: var(--merchant-primary);
    transform: translateY(-1px) scale(1.04);
}

.merchant-theme-color-dot.active::after {
    content: '';
    width: 8px;
    height: 13px;
    border: solid #ffffff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg) translateY(-1px);
}

.merchant-navigation-theme-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.merchant-navigation-theme-option {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    min-height: 58px;
    padding: 8px 10px;
    color: #526173;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border: 1px solid #dfe7f1;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    transition: border-color .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease;
}

.merchant-navigation-theme-option:hover,
.merchant-navigation-theme-option:focus-visible,
.merchant-navigation-theme-option.active {
    color: var(--merchant-primary);
    border-color: var(--merchant-primary);
    box-shadow: 0 12px 24px rgb(22 119 255 / 12%);
    transform: translateY(-1px);
    outline: none;
}

.merchant-navigation-theme-option__preview {
    position: relative;
    display: block;
    width: 48px;
    height: 32px;
    overflow: hidden;
    border: 1px solid rgb(15 23 42 / 12%);
    border-radius: 6px;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 20%);
}

.merchant-navigation-theme-option__preview i,
.merchant-navigation-theme-option__preview b,
.merchant-navigation-theme-option__preview em {
    position: absolute;
    display: block;
    content: '';
}

.merchant-navigation-theme-option__preview i {
    inset: 0 0 0 12px;
}

.merchant-navigation-theme-option__preview b {
    left: 17px;
    top: 10px;
    width: 23px;
    height: 5px;
    border-radius: 999px;
}

.merchant-navigation-theme-option__preview em {
    left: 4px;
    top: 6px;
    width: 5px;
    height: 20px;
    border-radius: 999px;
}

.merchant-settings-switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 36px;
    color: #5f6b7a;
    font-size: 14px;
    font-weight: 650;
}
</style>
