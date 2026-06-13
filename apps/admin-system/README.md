# Acquiring Admin System

`admin-system` 是收单平台内部管理后台，当前已完成工程启动、登录闭环、后端动态菜单和核心页面骨架整理。

## Scope

本应用只覆盖：

- `apps/admin-system`
- 必要的前端共享类型与请求工具

不要在本应用任务中修改：

- `apps/cashier`
- `apps/merchant-portal`

## Prerequisites

后端服务使用 `acquiring-orchestration/service-admin`，本地默认依赖：

- Nacos: `127.0.0.1:8848`
- MySQL: `127.0.0.1:3306/payment_acquiring`
- service-admin: `http://127.0.0.1:8001`

后端菜单和权限种子数据来自：

```bash
/Users/scott/Documents/code/ideaCodex/acquiring-orchestration/service-admin/src/main/resources/sql/admin-system-schema.sql
```

如本地库未初始化最终菜单，需要先执行该 SQL，保证 `sys_menu` 中存在 `/dashboard`、`/system/user`、`/merchant/info` 等最终路由。

## Start

后端：

```bash
cd /Users/scott/Documents/code/ideaCodex/acquiring-orchestration
mvn -pl service-admin -am package -DskipTests
java -jar service-admin/target/service-admin-0.1.0-SNAPSHOT.jar --spring.profiles.active=dev
```

前端：

```bash
cd /Users/scott/Documents/code/ideaCodex/acquiring-frontend
npm --workspace @acquiring/admin-system run dev
```

访问：

```text
http://localhost:5173
```

## Local Login

本地初始化账号：

```text
账号：admin
密码：Admin@123456
```

登录页会调用 `/admin/auth/verify-code/send` 获取开发验证码，并自动回填验证码输入框。

## Menu And Routes

左侧菜单以后端 `/admin/auth/me` 返回的 `menus` 为准，前端根据 `componentPath` 动态映射到：

```text
apps/admin-system/src/views/**/index.vue
```

最终菜单：

- 首页 / 工作台
- 系统管理 / 用户管理、角色管理、菜单管理、部门岗位、字典参数、日志管理
- 商户管理 / 商户信息
- 基础数据 / 国家/地区、币种管理、地区币种配置
- 权限中心 / 应用权限、数据权限
- 安全中心 / 会话管理、密钥与 API 安全

旧路由会 redirect 到新路由；找不到页面时使用 `views/_fallback/MissingView.vue`，不再抛错白屏。

## RuoYi-Style UI Rules

`admin-system` 的基础页面统一参考若依前后端分离版后台风格，使用白底、蓝色主色、紧凑表格和行内搜索。新增页面必须优先复用以下结构和 class，不要为单个页面重复定义一套搜索区、工具栏、表格、分页样式。

核心视觉基线：

- 左侧菜单宽度固定为 168px，折叠宽度 54px。
- 顶部导航高度 36px，标签栏高度约 34px。
- 内容区使用白底，不使用整页灰色卡片。
- 表单、按钮、表格统一使用 `size="small"`。
- 查询条件和列表正文统一使用 12px、`#606266`，表头使用 12px、`#515a6e`。
- 主色使用 Element Plus 默认蓝 `#409eff`，避免单页自定义大面积色块。

### Page Container

页面根节点使用：

```vue
<div class="app-container">
  ...
</div>
```

内容区不再使用大卡片包裹整页，保持若依式直接铺开：搜索区、工具栏、表格、分页自上而下排列。列表页默认不增加页面大标题和说明文字，标题由面包屑和 TagsView 表达。

### Search Form

查询区使用行内表单：

```vue
<el-form :model="query" :inline="true" size="small" class="search-form" label-width="68px">
  <el-form-item label="用户名称" prop="userName">
    <el-input v-model="query.userName" placeholder="请输入用户名称" clearable @keyup.enter="handleQuery" />
  </el-form-item>
  <el-form-item>
    <el-button type="primary" :icon="Search" size="small" @click="handleQuery">搜索</el-button>
    <el-button :icon="Refresh" size="small" @click="resetQuery">重置</el-button>
  </el-form-item>
</el-form>
```

规范：

- 表单使用 `size="small"`。
- 输入框、下拉框默认宽度由 `.search-form` 控制，不在页面里重复写宽度。
- 查询项 label 默认 `68px`，较长 label 最多调整到 `80px`。
- 查询按钮使用 `type="primary"`，重置按钮使用默认样式。
- 搜索区和工具栏之间只保留 8px 间距。

### Toolbar Buttons

工具栏使用若依式 `el-row + mb8`：

```vue
<el-row :gutter="10" class="mb8">
  <el-col :span="1.5">
    <el-button type="primary" plain :icon="Plus" size="small" v-hasPermi="'system:user:add'">新增</el-button>
  </el-col>
  <el-col :span="1.5">
    <el-button type="success" plain :icon="Edit" size="small" v-hasPermi="'system:user:edit'">修改</el-button>
  </el-col>
  <el-col class="right-toolbar">
    <el-button :icon="Search" size="small" circle />
    <el-button :icon="Refresh" size="small" circle />
  </el-col>
</el-row>
```

规范：

- 功能按钮统一 `size="small"`。
- 新增：`type="primary" plain`。
- 修改：`type="success" plain`。
- 删除：`type="danger"` 或 `type="warning" plain`，按页面危险程度选择。
- 右侧刷新、显隐搜索等圆形按钮统一放入 `class="right-toolbar"`，不要使用 `float:right`。
- 按钮级权限必须使用 `v-hasPermi`，角色控制使用 `v-hasRole`。

### Table

表格使用 Element Plus 原生表格，保持若依紧凑风格：

```vue
<el-table v-loading="loading" :data="rows" row-key="id" size="small">
  <el-table-column type="selection" width="50" align="center" />
  <el-table-column prop="userName" label="用户名称" align="center" show-overflow-tooltip />
  <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width" fixed="right">
    <template #default="{ row }">
      <el-button size="small" type="primary" link :icon="Edit" v-hasPermi="'system:user:edit'">修改</el-button>
      <el-button size="small" type="primary" link :icon="Delete" v-hasPermi="'system:user:delete'">删除</el-button>
    </template>
  </el-table-column>
</el-table>
```

规范：

- 表格必须设置 `size="small"`。
- 表头背景、行高、字号由 `main.css` 全局控制。
- 列表正文的字号和颜色必须与查询条件一致，不在页面内单独加深、放大或加粗。
- 列文本默认 `align="center"`，长文本列加 `show-overflow-tooltip`。
- 操作列必须使用 `label="操作"`、`class-name="small-padding fixed-width"`。
- 操作按钮统一 `size="small" type="primary" link`，危险操作可以使用 `type="danger"`。
- 操作列按钮必须横向排列，不允许自动换成多行。
- 操作列宽度按按钮数量设置：1 个按钮 80-100，2 个按钮 140-160，3 个按钮 180-220，4 个按钮 240-280，更多操作应使用下拉菜单。

### Pagination

分页区统一使用：

```vue
<div class="pagination-container" v-show="total > 0">
  <el-pagination
    v-model:current-page="page"
    v-model:page-size="pageSize"
    :total="total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next, jumper"
    background
  />
</div>
```

规范：

- 分页靠右。
- 默认页大小 `10`。
- 使用 `background`，保持若依式蓝色当前页。

### TagsView And Navigation

顶部标签导航使用 `layout/components/TagsView.vue`，样式由 `.tags-view` 统一控制：

- 标签使用扁平边框样式，带菜单图标和关闭图标。
- 当前标签使用浅蓝底、蓝色文字、蓝色边框。
- 标签高度 28px，标签栏高度约 34px。
- 支持关闭当前、关闭其他、关闭全部。
- 不在页面内单独调整标签样式。

## Verification

```bash
cd /Users/scott/Documents/code/ideaCodex/acquiring-frontend
npm --workspace @acquiring/admin-system run typecheck
npm --workspace @acquiring/admin-system run build
```

浏览器验收：

1. 打开 `http://localhost:5173/login`。
2. 使用本地账号登录。
3. 登录后进入 `/dashboard`。
4. 左侧菜单显示最终六组菜单。
5. 点击核心菜单页面不白屏。
6. 访问旧路由如 `/system/users`，应跳转到 `/system/user`。
7. Console 不应出现 `Missing view` 造成的 error。

## Current Limitations

- 核心页面已具备查询区、操作区、表格、分页和弹窗骨架，但业务 CRUD 接口尚未全量联调。
- 列表数据目前使用 `src/fixtures/crudData.ts` 的本地演示数据。
- 商户详情 Tab、角色授权、按钮级权限、导入导出和审计确认流程仍需后续阶段接入真实接口。
