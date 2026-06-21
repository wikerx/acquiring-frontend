<template>
    <section class="dashboard-welcome">
        <div class="dashboard-welcome__main">
            <p class="dashboard-welcome__eyebrow">{{ $t('dashboard.workspace') }}</p>
            <h1 class="dashboard-welcome__title">{{ $t('dashboard.welcomeBack', { name: displayName }) }}</h1>
            <p class="dashboard-welcome__description">{{ $t('dashboard.welcomeDescription') }}</p>
        </div>
        <div class="dashboard-welcome__meta">
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.today') }}</span>
                <strong>{{ todayText }}</strong>
            </div>
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.systemName') }}</span>
                <strong>{{ $t('layout.adminConsole') }}</strong>
            </div>
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.lastLoginTime') }}</span>
                <strong>{{ lastLoginTime }}</strong>
            </div>
            <div class="dashboard-welcome__meta-item">
                <span>{{ $t('dashboard.lastLoginIp') }}</span>
                <strong>{{ lastLoginIp }}</strong>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
interface Props {
    displayName: string;
    todayText: string;
    lastLoginTime: string;
    lastLoginIp: string;
}

defineProps<Props>();
</script>

<style scoped>
.dashboard-welcome {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
    gap: 20px;
    padding: 24px 28px;
    border: 1px solid #e6ebf2;
    border-radius: 18px;
    background:
        radial-gradient(circle at top right, rgba(64, 158, 255, 0.14), transparent 32%),
        linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.dashboard-welcome__eyebrow {
    margin: 0 0 10px;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.dashboard-welcome__title {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 700;
}

.dashboard-welcome__description {
    margin: 12px 0 0;
    max-width: 680px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
}

.dashboard-welcome__meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.dashboard-welcome__meta-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 92px;
    padding: 16px 18px;
    border: 1px solid #e8eef6;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.78);
}

.dashboard-welcome__meta-item span {
    color: #64748b;
    font-size: 12px;
}

.dashboard-welcome__meta-item strong {
    margin-top: 8px;
    color: #0f172a;
    font-size: 15px;
    font-weight: 600;
    word-break: break-word;
}

@media (max-width: 1200px) {
    .dashboard-welcome {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-welcome {
        padding: 20px;
        gap: 16px;
        border-radius: 16px;
    }

    .dashboard-welcome__title {
        font-size: 24px;
    }

    .dashboard-welcome__meta {
        grid-template-columns: 1fr;
    }
}
</style>
