<template>
    <main class="forbidden-page">
        <el-result
            icon="warning"
            title="403"
            sub-title="当前账号没有访问该功能的权限"
        >
            <template #extra>
                <el-button type="primary" @click="$router.push('/dashboard')">返回控制台</el-button>
            </template>
        </el-result>
    </main>
</template>
