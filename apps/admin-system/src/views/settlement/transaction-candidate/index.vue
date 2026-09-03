<!-- Admin 交易结算候选入口：仅路由到真实 CLEARING_REVISION 视图，保证金来源由独立页面承载。 -->
<template><SettlementCandidatePage kind="transaction" /></template>
<script setup lang="ts">
import SettlementCandidatePage from '@/views/settlement/components/SettlementCandidatePage.vue';
</script>
