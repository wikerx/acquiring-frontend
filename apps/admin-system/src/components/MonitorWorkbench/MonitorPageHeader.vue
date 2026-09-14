<template>
    <header class="monitor-page-header">
        <div class="monitor-page-header__copy">
            <h1>{{ title }}</h1>
            <p v-if="description">{{ description }}</p>
        </div>
        <div class="monitor-page-header__watermark" aria-hidden="true">VEXRA</div>
        <div class="monitor-page-header__actions"><slot /></div>
    </header>
</template>

<script setup lang="ts">
/** 系统监控页面统一标题、说明和操作区。 */
defineProps<{ title: string; description?: string }>();
</script>

<style scoped>
.monitor-page-header {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    min-height: 60px;
    margin-bottom: 16px;
    overflow: hidden;
}

.monitor-page-header__copy { position: relative; z-index: 1; min-width: 0; }
.monitor-page-header h1 { margin: 0; color: #1F2937; font-size: 21px; font-weight: 650; line-height: 30px; }
.monitor-page-header p { max-width: 760px; margin: 4px 0 0; color: #7B8794; font-size: 13px; line-height: 20px; }
.monitor-page-header__watermark { position: absolute; top: -14px; right: 84px; color: #246BFD; font-size: 54px; font-weight: 800; letter-spacing: 0; opacity: .045; user-select: none; }
.monitor-page-header__actions { position: relative; z-index: 1; display: flex; flex: 0 0 auto; align-items: center; gap: 8px; }

@media (max-width: 760px) {
    .monitor-page-header { flex-direction: column; }
    .monitor-page-header__actions { width: 100%; justify-content: flex-start; }
    .monitor-page-header__watermark { right: 0; }
}
</style>
