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
