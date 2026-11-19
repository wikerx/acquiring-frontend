<template>
  <div
    class="payment-method-carousel"
    role="group"
    :aria-label="`${label}: ${logos.map((logo) => logo.label).join(', ')}`"
    :data-scrolling="scrolling"
    ref="container"
  >
    <button
      v-if="logos.length > 1 && scrolling"
      class="payment-method-carousel__control"
      type="button"
      :aria-label="previousLabel"
      @click="step(-1)"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" class="payment-method-carousel__chevron">
        <path d="m10 3-5 5 5 5" />
      </svg>
    </button>
    <div
      ref="viewport"
      class="payment-method-carousel__viewport"
      tabindex="0"
      @keydown.left.prevent="step(-1)"
      @keydown.right.prevent="step(1)"
    >
      <div
        ref="track"
        class="payment-method-carousel__track"
        :style="{ '--cycle-duration': `${Math.max(20, logos.length * 3)}s` }"
        aria-hidden="true"
      >
        <div v-for="cycle in 2" :key="cycle" class="payment-method-carousel__cycle">
          <img
            v-for="logo in logos"
            :key="logo.key"
            :src="logo.asset"
            alt=""
            :title="logo.label"
            :data-logo-key="logo.key"
          />
        </div>
      </div>
    </div>
    <button
      v-if="logos.length > 1 && scrolling"
      class="payment-method-carousel__control"
      type="button"
      :aria-label="nextLabel"
      @click="step(1)"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" class="payment-method-carousel__chevron">
        <path d="m6 3 5 5-5 5" />
      </svg>
    </button>
  </div>
</template>
<script setup lang="ts">
  import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
  import { getPaymentLogos, type PaymentLogoKey } from '@acquiring/shared';
  const props = defineProps<{
    keys: PaymentLogoKey[];
    overflowOnly?: boolean;
    label: string;
    previousLabel: string;
    nextLabel: string;
  }>();
  const container = ref<HTMLElement | null>(null);
  const overflowing = ref(false);
  const scrolling = computed(() => !props.overflowOnly || overflowing.value);
  let resizeObserver: ResizeObserver | undefined;
  function measure() {
    const cycle = track.value?.firstElementChild as HTMLElement | undefined;
    overflowing.value = Boolean(
      cycle &&
      container.value &&
      cycle.scrollWidth - Number.parseFloat(getComputedStyle(cycle).paddingInlineEnd || '0') >
        container.value.clientWidth,
    );
  }
  onMounted(() => {
    resizeObserver = new ResizeObserver(measure);
    if (container.value) resizeObserver.observe(container.value);
    measure();
  });
  watch(
    () => props.keys,
    async () => {
      await nextTick();
      measure();
    },
  );
  onBeforeUnmount(() => resizeObserver?.disconnect());
  const track = ref<HTMLElement | null>(null);
  const viewport = ref<HTMLElement | null>(null);
  const logos = computed(() =>
    getPaymentLogos([...new Set(props.keys)]).filter((logo) => logo.asset),
  );

  function step(direction: -1 | 1) {
    // 沿当前轮转位置前后移动一个 Logo；悬停和聚焦期间暂停以便查看。
    const animation = track.value?.getAnimations()[0];
    if (animation && logos.value.length > 0) {
      const duration = Math.max(20, logos.value.length * 3) * 1000;
      const currentTime = typeof animation.currentTime === 'number' ? animation.currentTime : 0;
      animation.currentTime =
        (((currentTime + (direction * duration) / logos.value.length) % duration) + duration) %
        duration;
    } else if (viewport.value) {
      // 减少动态效果时使用原生横向滚动，同样保留手动前后浏览。
      const element = viewport.value;
      const end = element.scrollWidth - element.clientWidth;
      element.scrollLeft =
        direction > 0
          ? element.scrollLeft >= end - 1
            ? 0
            : Math.min(end, element.scrollLeft + 84)
          : element.scrollLeft <= 1
            ? end
            : Math.max(0, element.scrollLeft - 84);
    }
  }
</script>
<style scoped>
  .payment-method-carousel {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    width: 100%;
  }
  .payment-method-carousel__viewport {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    mask-image: linear-gradient(90deg, transparent, #000 12px, #000 calc(100% - 12px), transparent);
  }
  .payment-method-carousel__track {
    display: flex;
    width: max-content;
    animation: payment-logo-drift var(--cycle-duration) linear infinite;
  }
  .payment-method-carousel__cycle {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-inline-end: 24px;
  }
  .payment-method-carousel__cycle img {
    display: block;
    width: 60px;
    height: 30px;
    object-fit: contain;
    flex: 0 0 auto;
  }
  .payment-method-carousel:hover .payment-method-carousel__track,
  .payment-method-carousel:focus-within .payment-method-carousel__track {
    animation-play-state: paused;
  }
  .payment-method-carousel[data-scrolling='false'] .payment-method-carousel__track {
    animation: none;
  }
  .payment-method-carousel[data-scrolling='false']
    .payment-method-carousel__cycle
    + .payment-method-carousel__cycle {
    display: none;
  }
  .payment-method-carousel[data-scrolling='false'] .payment-method-carousel__viewport {
    mask-image: none;
  }
  .payment-method-carousel[data-scrolling='false'] .payment-method-carousel__cycle {
    padding-inline-end: 0;
  }
  .payment-method-carousel__control {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    padding: 7px;
    flex: 0 0 auto;
    border: 1px solid #e4eaf4;
    border-radius: 50%;
    background: #f6f8ff;
    color: #64748b;
    cursor: pointer;
  }
  .payment-method-carousel__control:hover {
    color: #2563eb;
    background: #eff4ff;
  }
  .payment-method-carousel__control:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 3px;
  }
  .payment-method-carousel__control svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }
  .payment-method-carousel__control .payment-method-carousel__chevron {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @keyframes payment-logo-drift {
    to {
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .payment-method-carousel__track {
      animation: none;
    }
    .payment-method-carousel__cycle + .payment-method-carousel__cycle {
      display: none;
    }
    .payment-method-carousel__viewport {
      overflow-x: auto;
      mask-image: none;
    }
  }
</style>
