<template>
    <section class="page-container">
        <div class="page-heading">
            <div>
                <span class="page-kicker">{{ category }}</span>
                <h1>{{ title }}</h1>
                <p v-if="description">{{ description }}</p>
            </div>
            <slot name="extra" />
        </div>
        <slot />
    </section>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    category?: string;
    description?: string;
}>();
</script>
