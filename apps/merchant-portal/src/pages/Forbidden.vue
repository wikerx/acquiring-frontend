<template>
    <div class="page forbidden-page">
        <el-result icon="warning" title="403" sub-title="当前账号暂无权限访问此页面">
            <template #extra>
                <el-button type="primary" @click="$router.push('/dashboard')">返回首页</el-button>
            </template>
        </el-result>
    </div>
</template>
