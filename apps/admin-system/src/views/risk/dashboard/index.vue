<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * 风险工作台目录入口，只负责把二级目录默认导向风控总览页，不承载业务数据加载。
 */
onMounted(() => {
  router.replace('/risk/dashboard/overview');
});
</script>
