<template>
  <section v-show="visible" class="merchant-list-card merchant-search-card">
    <el-form
      :model="model"
      inline
      size="small"
      class="search-form"
      @submit.prevent="$emit('search')"
    >
      <div class="search-form__fields"><slot /></div>
      <div class="search-form__fields">
        <slot name="time" />
        <div class="search-actions">
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
