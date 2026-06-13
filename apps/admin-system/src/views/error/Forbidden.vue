<template>
    <div class="app-container">
        <el-result icon="warning" :title="$t('permission.denied')" :sub-title="$t('permission.description')">
            <template #extra>
                <el-button type="primary" size="small" @click="$router.push('/dashboard')">{{ $t('permission.backHome') }}</el-button>
            </template>
        </el-result>
    </div>
</template>
