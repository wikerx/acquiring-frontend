# 费用试算页面设计验收

## 验收范围

- 参考图：`/var/folders/m9/nsm32l412y7d931ncrqhbtsm0000gn/T/codex-clipboard-0600717e-46d7-43a1-a487-fea7dc28c2b8.png`
- 真实管理端：`http://127.0.0.1:5173/`，未使用账号密码，仅确认登录页可正常加载
- 组件验收页：`http://127.0.0.1:5183/`，加载真实费用试算页面组件，以本地固定数据替代接口，避免产生试算审计记录
- 桌面视口：`1365 x 750`
- 移动视口：`390 x 844`

## 截图证据

- 桌面首屏：`/tmp/vexra-fee-qa.7HH7J0/implementation-desktop-current-viewport.png`
- 桌面明细与图表：`/tmp/vexra-fee-qa.7HH7J0/implementation-desktop-final-current.png`
- 历史记录展开：`/tmp/vexra-fee-qa.7HH7J0/implementation-history-current.png`
- 移动端输入与汇总：`/tmp/vexra-fee-qa.7HH7J0/implementation-mobile-current.png`
- 移动端明细与图表：`/tmp/vexra-fee-qa.7HH7J0/implementation-mobile-details-current.png`
- 移动端表格横向浏览：`/tmp/vexra-fee-qa.7HH7J0/implementation-mobile-table-scrolled-current.png`

## 验收结果

| 检查项 | 结果 | 证据 |
|---|---|---|
| 页面身份与非空渲染 | 通过 | 标题为“费用试算 QA - Vexra Admin”，输入区和结果区均有实际内容 |
| 风控服务选择 | 通过 | 内风控、外风控、3DS 三项可独立选择，试算后保持选中 |
| 费用明细 | 通过 | 显示交易手续费、三项风控费、结算处理费、拒付不适用项和保证金，共 7 行 |
| 费用计算说明 | 通过 | 显示费用合计明细及净结算明细，保证金未计入费用合计 |
| 费用占比图 | 通过 | 只统计实际手续费，右侧纵向图例一次显示 5 类费用 |
| 试算记录 | 通过 | 显示中文交易类型、银行卡和 Visa 标识、三项风控使用状态 |
| 历史明细展开 | 通过 | 展开后显示完整逐项快照、费用合计及净结算公式 |
| 导出入口 | 通过 | 导出按钮可见且点击无前端错误；导出行内容由后端聚焦测试覆盖 |
| 移动端布局 | 通过 | 页面宽度 `375/375` 无整体横向溢出，表格在内部从 `325` 滚动浏览 `1094` 宽内容 |
| 控制台健康 | 通过 | 最终桌面、记录展开、导出和移动端交互阶段均无新增错误或警告 |

## 说明

- 真实管理端浏览器验收受登录态限制，未输入或传输账号密码。
- 本次未执行数据库迁移，也未向真实费用试算接口写入数据。
- 前端类型检查和生产构建已通过；真实接口联调需在迁移完成并具备管理端登录态后执行。

final result: passed

# 结算单据与币种展示设计验收

## 验收范围

- 验收日期：`2026-09-13`
- 设计参考：用户提供的紧凑财务凭证、蓝白信息分区、支付品牌 Logo、币种旗帜及统一数据对齐方案
- 页面范围：管理端结算预审单/正式结算单/手动结算，商户端交易结算/保证金结算及批次详情，管理端币种管理
- 自动化浏览器：Google Chrome；桌面视口 `1440 x 1200`，移动视口 `390 x 844`
- PDF：管理端交易结算单与商户端保证金结算单各 50 条分页样本

## 设计处理

| 设计重点 | 最终处理 | 说明 |
|---|---|---|
| 单据顶部 | 品牌、单据标题、状态章、单据号和生成时间组成紧凑抬头 | 不再用大表格承载单据身份，保留财务凭证识别度 |
| 商户与账户 | 显示商户号、商户名称、结算资金账户 | 不向用户暴露数据库账户 ID |
| 专业术语 | 使用“交易结算”“保证金结算”“结算预审单”“正式结算单” | 不直接展示 `REGULAR`、`RESERVE_RELEASE` 等机器枚举 |
| 主题配色 | 管理端蓝白、商户端蓝绿，主题色仅用于层级、金额和结构分隔 | 白底为主，避免一屏堆叠装饰卡片 |
| 币种与支付 | 币种使用可配置 Logo/名称；支付方式优先显示 Visa、Mastercard、Apple Pay 等品牌 Logo | 币种管理列表的 Logo 与字母代码独立分栏 |
| 数据对齐 | 普通信息和枚举居中，金额与汇率右对齐 | 汇率按 8 位小数展示，例如 `1.00000000` |
| 大批次 | 页面明细分页，PDF 自动分页并保持连续序号 | 避免一次渲染上万条导致页面卡顿或崩溃 |

## 验收结果

| 检查项 | 结果 | 证据 |
|---|---|---|
| 管理端单据 | 通过 | 桌面宽度 `1120px`，交易结算单、审核信息、汇率依据与结算汇总层级清晰 |
| 商户端单据 | 通过 | 保证金结算单使用独立蓝绿主题，结构与管理端一致但系统身份可区分 |
| 币种本地化 | 通过 | 页面显示“美元”“欧元”，USD/EUR 旗帜与金额同时展示，恒等汇率为 `1.00000000` |
| 支付品牌 | 通过 | Visa、Mastercard、Apple Pay 三种 Logo 均加载，未退化为机器代码 |
| 枚举本地化 | 通过 | 自动化 DOM 检查中 `REGULAR`、`RESERVE_RELEASE` 出现次数均为 `0` |
| 移动端布局 | 通过 | 页面宽度 `390/390`、单据宽度 `366px`，无页面级横向溢出 |
| 移动端明细 | 通过 | 表格容器 `338px`、内容 `810px`；内部滚动 `472px` 后“结算金额”表头和金额单元格完整可见 |
| PDF 分页 | 通过 | 管理端和商户端均生成 3 页 A4：`1-20`、`21-44`、`45-50`，页码与连续序号正确 |
| PDF 内容 | 通过 | 中文标题、状态章、水印、币种旗帜、支付 Logo、金额与 8 位汇率在渲染图中无截断 |
| 币种编辑体验 | 通过 | 真实管理端新增表单输入 USD 后自动预览美国旗帜、`USD` 和“美元”，支持自动/地区旗帜/币种头像三种模式 |
| 控制台健康 | 通过 | 商户端及移动端无错误；管理端单据样本仅请求缺失的临时页 `favicon.ico`，与业务代码无关 |
| 币种列表真实数据 | 阻塞 | 数据库尚未执行 `20260913_01_currency_icon_key_migration.sql`，后台日志明确为 `Unknown column 'icon_key'` |

## 截图与文件证据

- 视觉对照：`/tmp/vexra-settlement-voucher-final-20260913/reference-comparison.png`
- 管理端桌面/移动端：`/tmp/vexra-settlement-voucher-final-20260913/admin-desktop.png`、`admin-mobile.png`、`admin-mobile-table-right.png`
- 商户端桌面/移动端：`/tmp/vexra-settlement-voucher-final-20260913/merchant-desktop.png`、`merchant-mobile.png`、`merchant-mobile-table-right.png`
- 币种 Logo 编辑器：`/tmp/vexra-settlement-voucher-final-20260913/currency-logo-editor-usd.jpg`
- 管理端 PDF：`/tmp/vexra-settlement-voucher-final-20260913/admin-50.pdf` 及 `admin-pdf/page-1.png` 至 `page-3.png`
- 商户端 PDF：`/tmp/vexra-settlement-voucher-final-20260913/merchant-50.pdf` 及 `merchant-pdf/page-1.png` 至 `page-3.png`

## 说明

- 共享 `SettlementVoucher`、`CurrencyDisplay` 与统一 PDF 生成器供管理端和商户端复用，避免相似页面各自维护样式和术语。
- 本轮只执行查询、表单预览、自动化截图与 PDF 下载，未执行审批、结算、入账或其他资金写操作。
- 未启动、关闭或重启现有服务，未执行任何数据库脚本。
- 在执行币种 Logo 迁移并重启相关后端服务前，结算单据仍可使用内置币种展示兜底；币种管理列表无法读取真实数据。
- 临时单据验收入口已删除，不进入生产构建。

final result: blocked
