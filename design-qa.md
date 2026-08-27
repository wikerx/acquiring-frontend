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
