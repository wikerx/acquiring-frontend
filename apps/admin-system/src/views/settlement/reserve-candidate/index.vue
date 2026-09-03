<!-- Admin 保证金结算候选入口：仅路由到 RESERVE_RELEASE/ADJUSTMENT 视图，不生成交易投影语义。 -->
<template><SettlementCandidatePage kind="reserve" /></template>
<script setup lang="ts">
import SettlementCandidatePage from '@/views/settlement/components/SettlementCandidatePage.vue';
</script>
