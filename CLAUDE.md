# acquiring-frontend 前端开发约束

> ⚠️ **给所有 AI 的第一条指令：以下是已交付的完整体系统，禁止以"优化"或"统一风格"为由重写或删除任何已有功能。你只能在此基础上增量开发。**

---

## 已交付能力清单（只读，禁止回退）

以下功能已经开发完成并验证通过。**绝对不允许**以任何理由删除、重写、降级或"简化"它们：

| 能力 | 关键文件 | 禁止事项 |
|------|---------|---------|
| 国际化 zh-CN / en-US | `src/i18n/` | 禁止删掉 `$t()` 改回硬编码中文；禁止删除 i18n 词条 |
| 语言切换（登录页 + 系统内共用） | `src/components/LanguageSwitch/index.vue` | 禁止在登录页或 Navbar 里另写一套语言切换逻辑 |
| TagsView 若依卡片风格 | `src/layout/components/TagsView.vue`、`src/styles/main.css` `.tags-view*` | 禁止改回原始样式；禁止删除 close 按钮、右键菜单 |
| 列表页 RightToolbar 统一 | `src/components/RightToolbar/index.vue` | 禁止把刷新/搜索按钮散落回业务按钮中间；禁止删除 tooltip |
| 16 个业务页面统一工具栏 | `src/views/system/*`、`src/views/base/*`、`src/views/monitor/*` | 禁止回退到 `float:right` / `style="margin-left:4px"` 的旧写法 |
| 主题色系统（12 色） | `src/utils/theme.ts`、`src/constants/app.ts` | 禁止在页面中写死 `#409eff`；必须用 `var(--app-primary)` |
| 布局配置 store | `src/store/modules/settings.ts` | 禁止删除配置项；禁止改用其他 localStorage key |
| SettingsPanel 配置面板 | `src/components/SettingsPanel/index.vue` | 禁止删除齿轮入口；禁止把配置项分散到其他位置 |
| 深色侧边栏 | `src/styles/main.css` `.layout-sidebar.dark` | 禁止删除 dark 模式代码 |
| 顶部横向菜单 | `src/layout/components/TopNav/index.vue` | 禁止删除 TopNav 组件；禁止把 `layoutMode: 'top'` 设回 disabled |
| Google 风格 TagsView | `src/styles/main.css` `.tags-view.google` | 禁止删除 Google 风格 CSS |
| 底部版权栏 | `src/layout/index.vue` `footer.layout-footer` | 禁止删除 footer；版权文案固定为 `Copyright © 2026 scott. All rights reserved.` |
| CLAUDE.md 规程 | `CLAUDE.md` | 禁止删除本文档中的任何约束条款 |

---

## 项目定位

本项目是跨境收单平台前端工程，包含后台管理系统、商户系统、Hosted Checkout 收银台系统等模块。

## 品牌与视觉规范

- 项目前端主品牌固定为 `Vexra`，禁止混用历史品牌名称。
- 管理系统展示名固定为 `Vexra Admin`。
- 商户系统展示名固定为 `Vexra Merchant`。
- 收银台展示名固定为 `Vexra Checkout`。
- 浏览器标题、登录页、侧边栏、Header、favicon、系统介绍文案都必须遵守同一套 Vexra 品牌体系。
- Logo 与 favicon 必须优先复用共享品牌资源，禁止使用截图、字母占位或未确认的替代图形。
- 浏览器标签页图标默认使用共享的 `vexra-icon.svg`。
- 品牌文案和品牌资源应优先集中维护，不要在多个页面重复硬编码。

后台管理系统整体风格参考 RuoYi-Vue，但代码修改必须遵守当前项目已有结构，不允许为了风格统一大规模重构业务逻辑。

Claude Code 修改本项目时必须先读取现有目录结构和代码风格，再进行改造。

## Layout 规范

后台管理系统统一使用项目 Layout 能力，包括：

- Sidebar 左侧菜单
- Navbar 顶部导航
- TagsView 多标签页
- AppMain 内容区域
- SettingsPanel 系统布局配置

新增布局能力必须优先复用现有 Layout，不允许重复创建一套新的后台框架。

## 主题规范

系统支持主题配置，包括：

- 主题色
- 深色/浅色侧边栏
- 左侧菜单/顶部菜单布局
- 固定 Header
- 显示 Logo
- 显示 TagsView
- TagsView 风格（card / google）

主题配置必须保存到 localStorage（key: `acquiring_admin_settings`），并在项目启动时恢复。

主题颜色应优先通过 CSS Variables（`--app-primary`、`--app-primary-light`、`--app-primary-dark`）控制，不允许在页面中大量写死颜色。

## 菜单规范

新增菜单必须遵守：

1. 一级菜单作为业务模块目录；
2. 二级菜单作为具体功能页面；
3. 菜单名称支持国际化（通过后端 menuCode → 前端 i18n `route.*` key 映射）；
4. 路由 path、name、component 必须和当前项目规范一致；
5. 权限标识按 `模块:资源:动作` 命名；
6. 图标使用 `@element-plus/icons-vue` 图标体系；
7. 不允许新增重复路由；
8. 不允许绕过权限系统显示菜单；
9. 不允许直接硬编码菜单列表。

## 按钮规范

页面按钮统一规则：

- 新增：`type="primary"`
- 修改：`type="success"` 或 `type="primary" plain`
- 删除：`type="danger"`
- 导出：`type="warning"`
- 导入：`type="info"` 或 `type="primary" plain`
- 搜索：`type="primary"`
- 重置：`type="default"`
- 详情：`type="primary" link`
- 表格行内操作使用 `link` 按钮，保持紧凑

所有业务按钮必须保留权限控制（`v-hasPermi` 指令），不允许因为样式调整删除权限判断。

## 列表页规范

后台管理类列表页统一结构：

1. 查询表单（`el-form :inline="true"`，`v-show="showSearch"`）；
2. 操作按钮栏（`el-row :gutter="10" class="mb8"`）；
3. 左侧业务按钮（新增、修改、删除、导出等，`el-col :span="1.5"`）；
4. 右侧 RightToolbar（搜索显隐 + 刷新，`el-col class="right-toolbar"`）；
5. 数据表格（`el-table`）；
6. 分页组件（`el-pagination`）；
7. 新增/编辑弹窗（`el-dialog`）；
8. 删除确认（`ElMessageBox.confirm`）；
9. 操作成功提示（`ElMessage.success`）。

搜索显隐和刷新按钮必须统一使用 `RightToolbar` 组件，不允许散落在业务按钮组中。

## 国际化规范

新增页面和组件必须接入国际化。至少支持：

- zh-CN
- en-US

页面标题、菜单名称、按钮、表单 label、表格列名、弹窗标题、提示语、校验信息都应使用 `$t()` / `t()` 国际化。

语言切换必须在登录页和系统内部都可用，并且共用同一个 `LanguageSwitch` 组件和 `acquiring_admin_locale` localStorage key。

## API 规范

- 每个业务域一个 API 文件（如 `api/system/user.ts`）；
- 统一使用 `request.post()` 传参，返回 `CommonResult<T>` 经 `unwrapResult` 解包；
- 所有请求/响应结构必须显式声明 TypeScript interface。

## 组件规范

项目中已有的公共组件必须优先复用：

| 组件 | 用途 |
|------|------|
| `RightToolbar` | 列表页右侧搜索显隐 + 刷新按钮 |
| `LanguageSwitch` | 语言切换下拉 |
| `BaseDateTime` | 日期时间格式化展示 |
| `BaseStatusTag` | 状态标签（启用/停用等） |
| `BaseAmount` | 金额格式化展示 |
| `DetailDescriptions` | 详情弹窗描述列表 |
| `AdminCrudPage` | 种子数据占位 CRUD 页面 |

## Claude Code 修改要求

Claude Code 修改代码前必须：

1. 先扫描现有代码结构；
2. 说明准备修改哪些文件；
3. 不允许大规模重构；
4. 不允许删除已有功能；
5. 不允许修改接口参数；
6. 不允许修改权限逻辑；
7. 不允许修改后端返回结构；
8. 不允许破坏路由、菜单、TagsView、KeepAlive；
9. 修改完成后必须说明变更文件和验证方式。
