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

# 商户开户与资料存储设计验收

## 验收范围

- 验收日期：`2026-09-15`
- 设计参考：用户提供的商户开户流程截图，重点检查步骤式表单、资料分区、状态信息和移动端操作区
- 页面范围：管理端商户信息列表、新增/编辑开户抽屉、商户详情、资料上传下载删除和开户提交门禁
- 基础设施：Docker MinIO、Nacos `common-dev.yaml` 与 `service-admin-dev.yaml`、商户开户数据库迁移
- 自动化浏览器：Google Chrome；桌面视口 `1440 x 900`，移动视口 `390 x 844`

## 截图证据

- 商户详情桌面端：`/tmp/merchant-detail-desktop.png`
- 商户详情移动端：`/tmp/merchant-detail-mobile.png`
- 编辑商户桌面端：`/tmp/merchant-edit-desktop.png`
- 编辑商户移动端：`/tmp/merchant-edit-mobile.png`
- 清理测试数据后的英文列表：`/tmp/merchant-info-final-en.png`

## 验收结果

| 检查项 | 结果 | 证据 |
|---|---|---|
| MinIO 部署 | 通过 | 容器健康；API 映射到 `127.0.0.1:9010`，Console 映射到 `127.0.0.1:9011`，未占用 SDK 的 `9000` 端口 |
| MinIO 凭据 | 通过 | 根账户和受限应用账户均已写入权限为 `600` 的运行时环境文件；仅验证变量非空，不在验收记录中输出明文 |
| MinIO 应用账户权限 | 通过 | 使用应用账户完成测试对象写入、读取、SHA-256 一致性校验和删除，删除后对象不可读取 |
| Nacos 配置 | 通过 | dev Namespace 中 `common-dev.yaml` 和 `service-admin-dev.yaml` 均可读取，并包含对象存储及商户敏感字段加密配置 |
| 数据库迁移 | 通过 | 商户开户要求的 63 个字段、3 张扩展表和 6 个索引均已存在 |
| 开户列表国际化 | 通过 | 英文模式下菜单、面包屑、页面标题、表格、详情状态和 28 项就绪提示无中文字符；切换中文后内容和页面标题同步更新 |
| 桌面编辑抽屉 | 通过 | 抽屉宽度 `1382px`，七步流程、三列表单和固定操作区完整显示，无控件越界或页面级横向溢出 |
| 移动编辑抽屉 | 通过 | 抽屉宽度 `390px`，移动进度条替代七步横排，表单可在内部纵向滚动；取消、下一步和保存草稿按钮均完整可见且无重叠 |
| 移动详情抽屉 | 通过 | 抽屉宽度 `390px`，无页面级横向溢出或控件越界 |
| 草稿提交门禁 | 通过 | 不完整草稿不显示提交按钮；直接调用提交接口返回业务失败码 `F402001`，数据状态保持 `DRAFT / NOT_SUBMITTED` |
| 资料上传闭环 | 通过 | PNG 上传、数据库元数据、MinIO 对象、页面下载摘要一致；页面删除后元数据软删除且对象移除 |
| 控制台健康 | 通过 | 修复可空布尔值直接绑定 `ElSwitch` 的告警后，重新加载和中英文切换均为 `0 errors / 0 warnings` |
| 后端回归 | 通过 | 4 个商户测试类共 26 项通过，Failures、Errors、Skipped 均为 0 |
| 前端构建 | 通过 | `npm run build:admin` 完成类型检查和 Vite 生产构建 |
| 补丁格式 | 通过 | 前后端仓库 `git diff --check` 均无错误 |
| 测试数据清理 | 通过 | QA 商户、已软删除资料元数据及关联记录剩余数量为 0，MinIO 测试对象不存在 |

## 说明

- MinIO 运行时凭据保存在 Docker 恢复栈目录的私有环境文件中，未写入 Git 跟踪文件。
- 商户资料表只保存对象存储元数据和摘要，不保存文件正文；后续迁移到 AWS S3 时可继续复用现有存储抽象。
- MinIO、Nacos、管理端前端和 `service-admin` 验收后保持运行。

final result: passed

# 商户开户视觉优化复验

## 验收范围

- 复验日期：`2026-09-14`
- 设计参考：用户提供的 5 张 Vexra 商户开户、商户详情、审核和渠道费率工作台截图
- 页面范围：管理端商户新增/编辑开户抽屉、商户详情、合规资料和审核轨迹
- 自动化浏览器：Playwright CLI + Google Chrome；桌面视口 `1440 x 900`，移动视口 `390 x 844`

## 参考图对照

| 参考重点 | 当前实现 | 结论 |
|---|---|---|
| 蓝白业务工作台 | 使用浅蓝商户身份头、细边框分区和克制阴影 | 通过 |
| 七步开户流程 | 桌面展示七步标题与说明，移动端切换为当前步骤进度条 | 通过 |
| 紧凑多列表单 | 桌面三列、移动单列，字段与操作区不重叠 | 通过 |
| 固定底部操作 | 取消、上一步、下一步和保存草稿保持可见，主次操作清晰 | 通过 |
| 商户详情工作区 | 商户身份、状态、申请号、时间和业务操作集中在顶部 | 通过 |
| 双列资料面板 | 基础、KYB、业务、联系人和结算信息使用双列细边框面板 | 通过 |

## 验收结果

| 检查项 | 结果 | 证据 |
|---|---|---|
| 英文步骤说明 | 通过 | 七项说明均为两行容器，`line-clamp=2`、`white-space=normal`，无省略号截断 |
| 桌面开户布局 | 通过 | 页面宽度 `1440/1440`，七步流程、三列表单和底部操作栏无页面级横向溢出 |
| 移动开户布局 | 通过 | 页面宽度 `390/390`，商户身份头、进度条、单列表单和底部按钮无重叠 |
| 开户步骤交互 | 通过 | 点击 `Next` 后当前步骤由 `Basic Profile 1/7` 更新为 `Company and KYB 2/7` |
| 合规资料标签 | 通过 | 标签切换成功，显示 3 行文件及上传、下载、删除操作 |
| 审核轨迹标签 | 通过 | 标签切换成功，显示提交审核和要求补件 2 条记录 |
| 英文国际化 | 通过 | 英文开户桌面、英文开户移动和英文详情的中文字符数均为 `0` |
| 移动详情布局 | 通过 | 抽屉宽度 `390px`、身份头宽度 `358px`，无页面级横向溢出 |
| 控制台健康 | 通过 | 最终各交互阶段均为 `0 errors / 0 warnings` |
| 前端构建 | 通过 | `npm run build:admin` 完成治理检查、`vue-tsc --noEmit` 和 Vite 生产构建 |
| 补丁格式 | 通过 | `acquiring-frontend` 与 `acquiring-orchestration` 的 `git diff --check` 均无错误 |

## 截图证据

- 英文开户桌面：`/tmp/merchant-onboarding-visual-qa/form-en-desktop-final.png`
- 英文开户移动：`/tmp/merchant-onboarding-visual-qa/form-en-mobile-final.png`
- 英文开户移动第二步：`/tmp/merchant-onboarding-visual-qa/form-en-mobile-step2-final.png`
- 英文详情桌面：`/tmp/merchant-onboarding-visual-qa/detail-en-desktop-final.png`
- 英文详情移动：`/tmp/merchant-onboarding-visual-qa/detail-en-mobile-final.png`
- 英文合规资料：`/tmp/merchant-onboarding-visual-qa/detail-en-documents-final.png`
- 英文审核轨迹：`/tmp/merchant-onboarding-visual-qa/detail-en-review-final.png`

## 说明

- 本轮使用隔离 Vite 入口加载真实商户组件和真实中英文资源，固定样本数据不访问真实接口，不写入商户、文件或资金数据。
- 生产构建仍提示现有大分包警告，不影响本轮页面功能和构建结果。
- Browser 插件不可用，因此按前端验收规范使用 Playwright CLI 完成截图、DOM、交互和控制台检查。

final result: passed
