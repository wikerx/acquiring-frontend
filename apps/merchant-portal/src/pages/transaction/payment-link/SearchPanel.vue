<template>
  <section v-show="visible" class="merchant-list-card merchant-search-card">
    <el-form
      :model="model"
      inline
      size="small"
      class="search-form pl-search-form"
      label-width="92px"
      @submit.prevent="$emit('search')"
    >
      <div class="pl-search-fields"><slot /></div>
      <div class="pl-search-time">
        <slot name="time" />
        <div class="pl-search-actions">
          <el-button type="primary" :icon="Search" @click="$emit('search')">{{
            searchText
          }}</el-button>
          <el-button :icon="RefreshLeft" @click="$emit('reset')">{{ resetText }}</el-button>
        </div>
      </div>
    </el-form>
  </section>
</template>
<script setup lang="ts">
  import { Search, RefreshLeft } from '@element-plus/icons-vue';
  defineOptions({ inheritAttrs: false });
  defineProps<{
    visible: boolean;
    model: Record<string, unknown>;
    searchText: string;
    resetText: string;
  }>();
  defineEmits<{ search: []; reset: [] }>();
</script>
<style scoped>
  .pl-search-form {
    display: grid;
    gap: 10px;
    width: 100%;
    margin: 0;
  }
  .pl-search-fields,
  .pl-search-time {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 18px;
    min-width: 0;
  }
  .pl-search-fields :deep(.el-form-item) {
    flex: 0 1 340px;
    min-width: 0;
    margin: 0;
  }
  .pl-search-fields :deep(.el-form-item__content),
  .pl-search-time :deep(.el-form-item__content) {
    flex: 1;
    min-width: 0;
  }
  .pl-search-fields :deep(.el-input),
  .pl-search-fields :deep(.el-select) {
    width: 100%;
  }
  .pl-search-time :deep(.transaction-time-form-item) {
    flex: 1 1 800px;
    max-width: 100%;
    min-width: 0;
    margin: 0;
  }
  .pl-search-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-left: auto;
  }
  @media (max-width: 650px) {
    .pl-search-fields :deep(.el-form-item),
    .pl-search-time :deep(.el-form-item) {
      flex-basis: 100%;
      display: block;
      width: 100%;
    }
    .pl-search-fields :deep(.el-form-item__label),
    .pl-search-time :deep(.el-form-item__label) {
      display: block;
      text-align: left;
      width: 100% !important;
    }
    .pl-search-fields :deep(.el-form-item__content),
    .pl-search-time :deep(.el-form-item__content) {
      margin-left: 0 !important;
    }
  }
</style>
