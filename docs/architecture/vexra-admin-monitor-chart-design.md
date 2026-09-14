# Vexra Admin 系统监控实施与验收报告

> 实施基线日期：2026-09-13
>
> 适用仓库：`acquiring-frontend`、`acquiring-orchestration`
>
> 需求依据：《Vexra Admin 系统监控完整设计与 Codex 实施说明 v1.1（含图表规范）》
>
> 本文性质：已实施状态、技术约束、验证证据和差异说明。本文不声明未接入的基础设施能力已经可用。

## 1. 需求结论

本次实施遵循以下不可变约束：

1. 系统监控保持“系统监控目录 -> 功能菜单”两级导航，JVM、GC、线程池和主机资源位于服务监控页面内部。
2. 保留原有在线用户、服务、缓存、任务、任务日志、执行节点、数据源、安全拦截、RocketMQ 和 Nacos 能力。
3. 监控页面不允许自行选择图表类型、颜色、尺寸、序列语义和布局。
4. 前端先扫描并复用现有 ECharts 技术栈，不引入第二套图表库。
5. 页面只消费后端返回的真实业务事实、聚合结果或明确的供应商能力状态，不伪造趋势和生产数据。
6. 未接入 Prometheus、Loki、SkyWalking/OpenTelemetry、RocketMQ Admin 等提供方时，接口和页面明确返回或展示 `NOT_CONFIGURED`。
7. 监控查询必须受时间范围、分页、SQL 超时、结果上限、脱敏和权限控制约束。
8. 告警接手、处理中和关闭等高风险写操作必须有权限、操作日志、处理历史和并发版本控制。

## 2. 图表库扫描结论

实施前对 `acquiring-frontend` 的依赖、共享组件和直接导入点进行了扫描，结论如下：

| 扫描项 | 实施结论 | 代码依据 |
|---|---|---|
| 图表库 | 统一复用 ECharts `5.6.0`，未新增其他图表依赖 | `packages/shared/package.json` |
| 底层运行时 | 复用 `AnalyticsChart.vue` 的实例生命周期、Canvas、Resize、Loading、Empty、ARIA 和事件能力 | `packages/shared/src/components/AnalyticsChart.vue` |
| 监控业务封装 | 在 Admin 内新增受控注册表与内部渲染器，不把业务语义写回通用共享层 | `apps/admin-system/src/components/MonitorChart` |
| 页面数据适配 | 全部集中在固定适配器，不在页面拼装 ECharts option | `apps/admin-system/src/api/monitor/workbenchAdapters.ts` |
| 构建门禁 | Admin 构建前执行监控图表治理脚本 | `apps/admin-system/scripts/verify-monitor-chart-governance.mjs` |

`AnalyticsChart` 仍是底层通用运行时，但监控页面不能直接使用它。这样既复用了现有库和基础能力，也避免页面通过任意 `option` 绕过监控规范。

## 3. 已实施总体架构

```mermaid
flowchart TB
    Page[监控页面] --> Api[workbench.ts]
    Api --> Backend[AdminMonitorWorkbenchController]
    Backend --> App[AdminMonitorWorkbenchApplicationService]
    App --> Service[JdbcAdminMonitorWorkbenchService]
    Service --> Transaction[交易逻辑表与业务事件]
    Service --> AdminDB[Admin 告警与安全事件表]
    Service --> Discovery[Spring Cloud DiscoveryClient]
    Service --> Runtime[JVM MXBean 内存采样]

    Page --> Adapter[workbenchAdapters.ts]
    Adapter --> Panel[MonitorChartPanel]
    Page --> Grid[MonitorChartGrid]
    Page --> Range[MonitorTimeRangeSelector]
    Page --> Status[MonitorStatusGrid]
    Panel --> Registry[固定图表定义注册表]
    Registry --> Internal[内部 Line/Bar/TopN/Donut/Waterfall 渲染器]
    Internal --> Shared[@acquiring/shared/AnalyticsChart]
    Shared --> ECharts[ECharts 5.6.0]
```

### 3.1 前端职责边界

| 层级 | 已实施职责 | 明确禁止 |
|---|---|---|
| 监控页面 | 查询条件、调用 API、展示摘要/列表、触发筛选联动 | ECharts `option`、图表类型、颜色、尺寸、布局 |
| 数据适配器 | 把后端 DTO 转为受控数据集，保留 `null` 与有效 `0` 的区别 | 伪造采样、猜测阈值、把缺失值改成零 |
| 图表定义注册表 | 固定 kind、size、series key、unit、semantic、TopN/Donut 上限 | 页面覆盖注册表 |
| 内部渲染器 | 生成 ECharts option、Tooltip、坐标轴、阈值线和可访问性描述 | 从业务页面直接导入 |
| 共享运行时 | ECharts 实例、Canvas、ResizeObserver、销毁和基础事件 | Admin 监控业务语义 |

### 3.2 后端职责边界

| 层级 | 已实施职责 |
|---|---|
| Controller | HTTP 映射、权限注解、请求校验、操作审计 |
| ApplicationService | 监控用例编排，保持接口层与查询实现分离 |
| Service | 数据源选择、时间范围标准化、数据库聚合、分页、脱敏、供应商能力说明 |
| SQL/采样器 | 交易逻辑表读取、Admin 库统计、JVM 真实采样和告警状态持久化 |

## 4. 受控图表实现

### 4.1 唯一公开组件

监控图表模块的公共入口只导出以下四个 Vue 组件：

- `MonitorChartPanel`
- `MonitorChartGrid`
- `MonitorTimeRangeSelector`
- `MonitorStatusGrid`

同时仅导出页面需要的数据集和事件类型。图表注册表、页面注册表、Token、格式化器、option builder 和 `internal` 渲染器均不公开。

### 4.2 固定视觉 Token

| 语义 | 固定颜色 | 使用范围 |
|---|---|---|
| `primary` | `#246BFD` | 主趋势、总量、P95、Used |
| `secondary` | `#36A3FF` | Memory、Idle、同类辅助指标 |
| `tertiary` | `#78B8FF` | Avg、Committed 等弱辅助线 |
| `success` | `#22A06B` | 成功、健康、Hit |
| `warning` | `#F59E0B` | 告警、P99、Retry、接近阈值 |
| `error` | `#E5484D` | 失败、异常、Error 阈值 |
| `critical` | `#C62828` | Critical |
| `neutral` | `#8A97A8` | Max、未知、参考信息 |

监控语义色不跟随 Admin Shell 的可配置主题色，以保证健康、警告和错误含义稳定。

### 4.3 固定图表定义

当前注册表包含 38 个稳定定义：

| 页面 | 定义 | 固定类型 |
|---|---|---|
| 监控总览 | `overview.apiRequests`、`overview.apiLatency`、`overview.alertTrend` | Line、Line、Stacked Bar |
| 服务监控 | `service.hostUsage`、`service.jvmHeap`、`service.gc`、`service.threadPool` | Line、Line、Bar + Line、Line |
| API 监控 | `api.requestTrend`、`api.failureRate`、`api.latency`、`api.httpErrorTop`、`api.merchantTop` | Line、Line、Line、TopN、TopN |
| 交易链路 | `trace.waterfall` | Waterfall |
| 渠道健康 | `channel.successRate`、`channel.latency`、`channel.errorTop`、`channel.paymentMethodRate` | Line、Line、TopN、Grouped Bar |
| Webhook | `webhook.successRate`、`webhook.httpStatus`、`webhook.retryTrend` | Line、Bar、Stacked Bar |
| Redis | `redis.memory`、`redis.ops`、`redis.hitRate`、`redis.keyTypes` | Line、Line、Line、Donut |
| 数据源 | `datasource.pool`、`datasource.sqlLatency`、`datasource.slowSqlTop` | Line、Line、TopN |
| 任务调度 | `job.resultTrend` | Stacked Bar |
| 执行节点 | `jobNode.resourceDetail` | Line |
| 告警中心 | `alert.trend`、`alert.sourceTop`、`alert.contextMetric` | Stacked Bar、TopN、Line |
| 安全拦截 | `security.interceptTrend`、`security.typeTop`、`security.merchantTop` | Line、TopN、TopN |
| RocketMQ | `rocketmq.consumerLag`、`rocketmq.tps` | Line、Line |
| Nacos | `nacos.instanceTrend` | Line |

确定性限制：TopN 固定最多 10 项，Redis Donut 固定 Top4 + Other 且最多 5 类；Webhook Retry 固定为堆叠柱状图；Redis Memory 固定为折线图；缺失值保持 `null`。

### 4.4 固定页面布局

当前注册表包含 14 个页面定义：

| 页面定义 | 布局 | 实施状态 |
|---|---|---|
| `overview` | `overview` | 页面已接入 |
| `api` | `analysis` | 页面已接入 |
| `channel` | `analysis` | 页面已接入 |
| `service-detail` | `detail` | 页面已接入 |
| `webhook` | `analysis` | 页面已接入 |
| `redis` | `analysis` | 页面已接入，历史图表显示供应商缺口 |
| `datasource` | `analysis` | 页面已接入，历史图表显示供应商缺口 |
| `job` | `single` | 页面已接入，历史图表显示供应商缺口 |
| `job-node-detail` | `detail` | 页面已接入，历史图表显示供应商缺口 |
| `alert` | `analysis` | 页面已接入 |
| `security-intercept` | `analysis` | 页面已接入 |
| `trace` | `single` | 页面已接入 |
| `rocketmq` | `analysis` | 保留定义，当前仍是外部控制台 |
| `nacos` | `single` | 保留定义，当前仍是外部控制台 |

桌面布局由注册表决定，容器小于 880px 时统一降为单列。固定图表内容高度为 `large=320px`、`standard=300px`、`compact=280px`。

### 4.5 构建治理门禁

`verify-monitor-chart-governance.mjs` 已接入 Admin `build`，检查：

1. Admin 业务代码不得直接导入 ECharts。
2. 受治理页面不得直接使用 `AnalyticsChart`。
3. 页面不得声明 ECharts `series`、`xAxis`、`yAxis`、`grid`、`legend` 或 `type`。
4. 页面不得写入固定监控语义色。
5. 页面不得导入 `MonitorChart/internal`。
6. 38 个定义必须完整且唯一。
7. 每个图表必须且只能属于一个固定页面定义。
8. 页面中的 `page-definition-id` 和 `definition-id` 必须是字面量并与注册表完全匹配。
9. 除 RocketMQ、Nacos 供应商页面外，每个页面定义必须有实际页面接入。
10. `0` 必须被视为有效数据，只有 `null` 或非数值才是缺失。

当前门禁结果为：38 个图表定义、14 个页面定义、12 个已实施页面分配全部通过。

## 5. 页面实施结果

| 页面 | 已实施能力 | 主列表 |
|---|---|---|
| 监控总览 | 摘要、API 请求/耗时、告警趋势、关键依赖状态、最新告警 | `StandardTable` |
| 在线用户 | 登录账号/姓名/IP 条件、过期会话过滤、稳定分页、强制下线审计 | `StandardTable` |
| 服务监控 | Nacos 服务实例、当前 Admin 节点主机/JVM/GC、线程池能力提示 | `StandardTable` |
| API 监控 | 请求量、失败量、成功率、Avg/P95/P99、业务响应码 Top10、Merchant Top10 | `StandardTable` |
| 交易链路 | TransactionId/MerchantOrderNo/ChannelOrderNo/TraceId 定位、摘要、Waterfall、事件时间线 | 时间线与详情 |
| 渠道健康 | 成功率、P95/P99、Timeout、连续失败、错误 Top10、支付方式成功率；错误 Top 和支付方式图表点击后联动列表筛选 | `StandardTable` |
| Webhook | `sent`、`successRate`、`failed`、`retrying`、`finalFailed` 五项摘要，成功率、HTTP Status、Retry/DLQ、最终状态、失败详情 | `StandardTable` |
| 缓存监控 | Redis 当前信息和受控 Key 查询/删除，历史指标明确未配置 | 既有缓存列表能力保留 |
| 数据源监控 | 当前连接池/数据源快照、分组与导出，历史 SQL 图表明确未配置 | `StandardTable` |
| 任务调度 | 原有新增、编辑、启停、手动执行、删除能力保留；历史趋势明确未配置 | `StandardTable` |
| 任务日志 | 原有查询、导出、删除、清理能力保留 | `StandardTable` |
| 执行节点 | 节点状态、心跳、并发数与详情保留；资源历史明确未配置 | `StandardTable` |
| 日志检索 | 结构化业务事件与安全事件统一查询，支持 Trace/交易/Merchant/服务/级别/关键字 | `StandardTable` |
| 告警中心 | Channel/Security 告警聚合、趋势、来源、负责人、接手、处理中、关闭、历史 | `StandardTable` |
| 安全拦截事件 | 原有查询/导出/详情/标记保留，增加趋势、类型 Top10、Merchant Top10；一个统一时间选择器同步驱动列表与统计 | `StandardTable` |
| RocketMQ 控制台 | 原外部控制台入口保留 | 外链 |
| Nacos 控制台 | 原外部控制台入口保留 | 外链 |

## 6. 后端接口清单

统一前缀：`/admin/monitor/workbench`。

| 方法 | 路径 | 权限 | 数据性质 |
|---|---|---|---|
| POST | `/overview` | `system:monitor:overview:query` | 多域真实摘要与聚合 |
| GET | `/services` | `system:monitor:service:query` | DiscoveryClient 服务实例 |
| POST | `/runtime` | `system:monitor:service:query` | 当前 Admin JVM/主机内存采样 |
| GET | `/capabilities` | `system:monitor:overview:query` | 供应商能力状态 |
| POST | `/apis/search` | `system:monitor:api:query` | 商户 API 交互事实聚合 |
| POST | `/traces/search` | `system:monitor:trace:query` | 交易业务事件链路 |
| POST | `/channels/search` | `system:monitor:channel:query` | 渠道请求事实聚合 |
| POST | `/webhooks/search` | `system:monitor:webhook:query` | 商户通知及尝试日志聚合 |
| POST | `/logs/search` | `system:monitor:log:query` | 结构化业务/安全事件检索 |
| POST | `/alerts/search` | `system:monitor:alert:query` | Channel/Security 告警聚合 |
| GET | `/alerts/{sourceType}/{sourceId}` | `system:monitor:alert:query` | 告警详情、来源指标、处理历史 |
| PUT | `/alerts/{sourceType}/{sourceId}/take-over` | `system:monitor:alert:handle` | 接手告警，记录审计 |
| PUT | `/alerts/{sourceType}/{sourceId}/processing` | `system:monitor:alert:handle` | 标记处理中，记录审计 |
| PUT | `/alerts/{sourceType}/{sourceId}/close` | `system:monitor:alert:handle` | 关闭告警，记录审计 |
| POST | `/security/statistics` | `system:monitor:security:query` | 安全事件数据库聚合 |

在线用户仍使用 `/admin/monitor/online/list` 和 `/admin/monitor/online/{sessionId}`；强制下线权限为 `system:online:forceLogout`，并有 `@OperationLog`。

Webhook 人工重发沿用 `/admin/transactions/merchant-notifications/retry`，权限为 `transaction:merchant-notification:retry`，服务端写入可靠 MQ Outbox，前端每次操作生成稳定 `requestId`，控制器记录操作日志。

## 7. 真实数据来源

| 能力 | 当前真实来源 | 说明 |
|---|---|---|
| 服务实例 | Spring Cloud `DiscoveryClient` | 读取服务与实例，不从浏览器直连 Nacos |
| 主机/JVM/GC | JVM MXBean、`com.sun.management.OperatingSystemMXBean` | 每分钟采样，最多保留 7 天，仅当前 Admin 进程 |
| API 监控 | `transaction_merchant_api_interaction_log` | 数据库完成计数、时间桶、TopN 和全局百分位计算 |
| 交易链路 | `transaction_locator`、交易详情聚合服务及交易事件表 | 汇总 Merchant API、Flow、Channel、Webhook 事件 |
| 渠道健康 | `transaction_channel_request`、`channel_alert_event` | 成功率、Timeout、连续失败、错误与延迟；`transaction_channel_request` 当前没有已验证的国家/地区来源，不推断地域维度 |
| Webhook | `transaction_merchant_notification`、`transaction_merchant_notification_log` | 最终状态、尝试次数、HTTP Status、Retry/DLQ |
| 日志检索 | 交易结构化事件表、`security_intercept_event` | 不是应用日志全文替代品 |
| 告警 | `channel_alert_event`、`security_intercept_event` | 人工处置覆盖层单独持久化 |
| 安全统计 | `security_intercept_event` | 时间桶、风险计数、类型和 Merchant Top10；当前表没有 TransactionId，不伪造交易关联 |
| Redis 当前状态 | 既有 Admin Cache ApplicationService | 受控扫描与只读详情；删除沿用独立高权限 |
| 数据源当前状态 | 既有 Admin Datasource ApplicationService | 当前快照和导出 |

所有图表和摘要均来自上述数据源。数据源无记录时展示 Empty；外部提供方未配置时展示 `NOT_CONFIGURED`，不使用 Mock 填充。

## 8. 告警状态与持久化

新增表：

| 表 | 用途 | 关键约束 |
|---|---|---|
| `monitor_alert_handle_state` | 保存负责人、处置状态、最新备注和乐观锁版本 | `(source_type, source_id)` 唯一索引 |
| `monitor_alert_handle_history` | 保存 TAKEOVER、MARK_PROCESSING、CLOSE 历史 | 来源+时间、操作人+时间索引 |

状态为 `OPEN`、`PROCESSING`、`RECOVERED`、`CLOSED`。来源告警已经恢复或关闭时，人工覆盖状态不得把它回退为未恢复状态。写操作携带 `version`，并发修改时返回状态冲突，避免旧页面覆盖新处置结果。

## 9. 菜单与权限

### 9.1 两级菜单

`system_monitor` 是唯一系统监控目录，17 个功能均直接挂在该目录下：

1. 监控总览
2. 在线用户
3. 服务监控
4. API 监控
5. 交易链路
6. 渠道健康监控
7. Webhook 监控
8. 缓存监控
9. 数据源监控
10. 任务调度
11. 任务日志
12. 执行节点
13. 日志检索
14. 告警中心
15. 安全拦截事件
16. RocketMQ 控制台
17. Nacos 控制台

分表管理继续属于独立的 `monitor_sharding` 目录，不嵌入 `system_monitor`，避免形成系统监控三级菜单。

### 9.2 权限实施

新工作台接口均使用 `@RequiresPermission`。告警写操作、在线用户强制下线、安全事件标记/导出和 Webhook 人工重发使用 `@OperationLog`。

SQL 为 `ADMIN_OPERATOR` 和 `ADMIN` 授予新增查询/处置权限，并建立菜单、权限与资源方法/路径的映射。

## 10. 安全与性能边界

| 边界 | 已实施控制 |
|---|---|
| 查询时间 | 默认 24 小时，最大 7 天；非法时区和反向范围直接拒绝 |
| 采样粒度 | 根据跨度固定为 5、15、60 或 360 分钟 |
| 数据库超时 | 监控 JDBC 查询超时固定 5 秒 |
| 分页 | 公共分页默认 20，单页最多 500；在线用户单页进一步限制为 100 |
| 日志结果 | 汇总后最多保留 1000 条候选，再执行稳定排序和分页 |
| 聚合 | 计数、时间桶、TopN、百分位和 Webhook 分页优先在数据库完成 |
| TopN | 数据库与前端定义均限制为 10；Donut 限制为 5 |
| 交易分片 | 通过 `TransactionLogicalReadExecutor` 和交易逻辑表读取，不绕过分片治理 |
| Redis | 沿用受控 Key 扫描和分页，不执行全量 `KEYS` 展示 |
| 敏感信息 | Authorization、Cookie、Token、Secret、Password、API Key、CVV/CVC、PAN、URL 密钥参数统一脱敏 |
| 高基数 | 未新增 Prometheus 高基数 Tag；Merchant、响应码等只作为受限 SQL 聚合维度返回 |
| 核心支付 | 监控读取位于 Admin 服务，不向核心交易写入高频 Metrics；JVM 历史仅在 Admin 进程内存中采样 |

## 11. 供应商能力矩阵

| 能力 | 状态 | 当前处理 |
|---|---|---|
| Nacos 服务发现 | `AVAILABLE` | 通过 DiscoveryClient 读取服务与实例 |
| 当前 Admin JVM | `AVAILABLE` | JVM MXBean 每分钟内存采样 |
| Prometheus 服务级历史 | `NOT_CONFIGURED` | 服务级 CPU/JVM/API Metrics 不伪造 |
| Loki/Elasticsearch 日志上下文 | `NOT_CONFIGURED` | 保留结构化业务事件查询，明确无全文和上下文 ±20 行 |
| SkyWalking/OpenTelemetry Span | `NOT_CONFIGURED` | 提供业务时间线，不声称完整分布式 Span |
| RocketMQ Admin | `NOT_CONFIGURED` | 保留现有外部控制台入口，不伪造 Lag/TPS |
| 线程池统一绑定 | `NOT_CONFIGURED` | 服务页显示能力缺口 |
| Redis 历史指标 | `NOT_CONFIGURED` | 保留当前快照和 Key 管理，历史图表为空态 |
| 数据源/SQL 历史 | `NOT_CONFIGURED` | 保留当前连接池快照，历史图表为空态 |
| 任务历史聚合 | `NOT_CONFIGURED` | 保留任务与任务日志列表，不在前端聚合趋势 |
| 执行节点资源历史 | `NOT_CONFIGURED` | 保留节点心跳/并发状态，资源图为空态 |
| 告警前后指标上下文 | `NOT_CONFIGURED` | 保留触发事实与处置历史 |
| API HTTP Metrics | `NOT_CONFIGURED` | 当前业务表没有 HTTP Method、HTTP Status、4xx/5xx、限流和鉴权指标 |

## 12. 与需求方案的明确差异

| 编号 | 差异 | 原因与处理 |
|---|---|---|
| D1 | 服务监控历史只覆盖当前 Admin 节点，不覆盖任意微服务实例 | 未配置 Prometheus；页面明确显示供应商缺口 |
| D2 | 线程池图表无数据 | 未注册统一线程池采集器；保持 `NOT_CONFIGURED` |
| D3 | API 页面展示业务响应码，不展示 HTTP 4xx/5xx、限流和鉴权分布 | 现有 Merchant API 交互表没有这些字段，未猜测协议 |
| D4 | 交易链路是结构化业务时间线，不是完整 APM Span | SkyWalking/OpenTelemetry 未配置 |
| D5 | 日志检索不是 Loki/ELK 全文日志和上下文查看器 | 当前只读取可审计的结构化业务/安全事件 |
| D6 | 告警中心当前统一 Channel 和 Security 两类来源 | 仓库没有通用 `monitor_alert_event` 事实表；使用来源事实加人工覆盖层 |
| D7 | RocketMQ、Nacos 保持外部控制台，不创建内置详情页 | 遵循“不替换现有控制台”与不直连基础设施约束 |
| D8 | Redis、数据源、任务、执行节点的历史图表保留受控空态 | 后端没有可信历史聚合提供方，禁止前端伪造趋势 |
| D9 | 同一权限码对应多个 Controller 方法时，数据库资源表只登记一个规范资源路径 | 每个 Controller 方法仍有独立 `@RequiresPermission`；资源表当前模型无法为同一权限码保存多条规范路径而不改变唯一性约束 |
| D10 | 总览没有虚构 MQ Lag、汇率源、短信或邮件健康值 | 只展示可从当前真实服务/业务事实得到的依赖和摘要 |
| D11 | 渠道健康未展示国家/地区维度 | `transaction_channel_request` 当前 Schema 没有国家/地区字段，也没有可证明的关联来源；禁止从 IP 或其他字段自行推断 |
| D12 | 安全拦截事件不支持 TransactionId 查询与展示 | `security_intercept_event` 当前 Schema 没有 TransactionId；保留 TraceId、Merchant、IP、事件类型等真实字段 |

## 13. 验证证据

### 13.1 后端

| 验证 | 结果 |
|---|---|
| `JdbcAdminMonitorWorkbenchServiceTest` 定向测试 | 16 项，0 Failure，0 Error，0 Skipped |
| `mvn -pl service-admin -am test`，JDK 17 | Reactor 17/17 SUCCESS；以本轮启动标记筛选的新生成 Surefire XML 共 940 项测试，0 Failure、0 Error、17 Skipped；其中 `service-admin` 516 项全部通过；BUILD SUCCESS |
| Admin JAR 打包 | `service-admin-1.0.0-SNAPSHOT.jar` 成功生成并以 JDK 17 启动 |
| 跳过项 | 17 项均为 Redis Cluster、连接失败注入或外部 Redis 集成测试，当前环境未启用对应集成测试条件 |
| 关键合同测试 | 权限注解、审计、两级菜单、权限 SQL、时间范围、脱敏、JVM null 语义、数据库聚合、告警状态并发均通过 |
| 安全统计真实查询 | 业务码 `T200`；拦截汇总为 6，5 个趋势点合计为 6，验证 MySQL 字符串时间桶可被完整解析和聚合 |

### 13.2 前端

| 验证 | 结果 |
|---|---|
| 图表治理脚本 | 38 个图表定义、14 个页面定义、12 个页面分配通过 |
| 格式化器行为测试 | MySQL 微秒时间、`Asia/Shanghai` 墙上时间语义、紧凑坐标标签和非法输入回退均通过 |
| `vue-tsc --noEmit` | 通过 |
| Admin 生产构建 | Vite 3112 modules transformed，构建成功 |
| 构建警告 | 仅第三方 PURE 注释与大 chunk 提示，无构建错误 |

### 13.3 浏览器验收

当前执行环境未提供浏览器插件，因此使用项目 Playwright 依赖和本机 Chrome 完成等价的真实浏览器验收。

| 验证 | 结果 |
|---|---|
| 覆盖范围 | 15 条监控路由，桌面 `1440x1000` 与移动端 `390x844`，共 30 个页面视图 |
| 页面完整性 | 0 登录重定向、0 标题不匹配、0 Vite Overlay、0 页面异常 |
| 响应式布局 | 0 文档横向溢出、0 控件裁切；移动端运行时图表统一为 270px 单列 |
| API | 所有被访问接口均为 HTTP 200 和业务码 `T200`；任务、任务日志、执行节点接口均通过 |
| 图表渲染 | 所有可见 Canvas 尺寸均大于 0，像素检测均为非透明内容，无 ECharts 零尺寸告警 |
| 运行时格式 | 桌面和移动端 Uptime 均显示数值化“天/小时/分钟”；GC 横轴渲染 `HH:mm` 紧凑时间，未出现微秒原始时间戳 |
| 交互 | “最近6小时”可选中并重新请求总览；渠道错误 Top 联动 `errorCode`、支付方式联动 `paymentMethod`；Webhook HTTP 状态联动列表并显示 `finalFailed`；安全页时间范围同步刷新列表和统计 |
| 能力缺口 | 供应商缺口页面可见展示 `NOT_CONFIGURED`，未以空白图或模拟数据替代 |

浏览器日志中仅有验收脚本调用 `getImageData` 进行像素检测时产生的 Canvas readback 性能提示；该提示不是应用代码产生的运行错误。

### 13.4 本地运行与迁移

| 验证 | 结果 |
|---|---|
| Admin 前端 | `http://127.0.0.1:4173` 返回 HTTP 200 |
| Admin 服务 | `http://127.0.0.1:18001/actuator/health` 返回 HTTP 200、`UP` |
| Job 服务 | `http://127.0.0.1:18007/actuator/health` 返回 HTTP 200、`UP` |
| 告警表迁移 | `payment_acquiring` 已存在 `monitor_alert_handle_state`、`monitor_alert_handle_history` 两张表 |
| 菜单迁移 | `system_monitor` 下已存在 17 个直接子菜单/外链，无三级监控菜单 |
| 权限迁移 | 11 个新增监控权限已存在，本地 `ADMIN_OPERATOR` 已获得全部 11 个权限映射 |

## 30. 验收矩阵

状态说明：`PASS` 表示当前代码与验证证据满足；`PROVIDER_GAP` 表示实现保留了明确能力边界，但外部采集/查询提供方未配置；`DEVIATION` 表示交付与方案存在已解释差异。

| 分类 | 验收项 | 状态 | 证据或说明 |
|---|---|---|---|
| 菜单 | 系统监控只有两级 | PASS | 17 个功能直接挂载 `system_monitor` |
| 菜单 | 无三级左侧菜单 | PASS | JVM/GC/线程池/主机资源在服务页内部；分表管理为独立目录 |
| 菜单 | 现有 10 个功能全部保留 | PASS | 在线、服务、缓存、任务、任务日志、执行节点、数据源、安全拦截、RocketMQ、Nacos 均保留 |
| 菜单 | 新增功能按权限展示 | PASS | 菜单权限码、Controller 注解及角色授权 SQL 已实施 |
| 监控总览 | 使用真实数据 | PASS | 读取 Discovery、API/Channel/Webhook 事实表及告警来源表 |
| 监控总览 | 能快速发现异常 | PASS | 健康摘要、失败/延迟趋势、告警趋势、依赖状态和最新告警 |
| 监控总览 | 不堆无意义图表 | PASS | 仅 3 张固定图表，依赖健康使用状态矩阵 |
| 服务监控 | JVM 可查看 | PASS | 当前 Admin JVM Heap、Non-Heap、线程、Class、GC、Uptime |
| 服务监控 | 线程池可查看 | PROVIDER_GAP | 页面和固定定义已落地，统一线程池采集器未配置 |
| 服务监控 | 主机资源可查看 | PASS | 当前 Admin 节点 CPU、Memory、Disk、Load 真实采样 |
| 服务监控 | 不新增三级菜单 | PASS | 服务内部视图承载运行时指标 |
| API 监控 | 请求量 | PASS | 商户 API 交互表数据库聚合 |
| API 监控 | 成功率 | PASS | 依据业务请求/响应结果计算 |
| API 监控 | Avg | PASS | 数据库聚合真实 `duration_millis` |
| API 监控 | P95 | PASS | 跨分片全局有序百分位查询 |
| API 监控 | P99 | PASS | 跨分片全局有序百分位查询 |
| API 监控 | 4xx | PROVIDER_GAP | 当前 API 事实表没有 HTTP Status |
| API 监控 | 5xx | PROVIDER_GAP | 当前 API 事实表没有 HTTP Status |
| API 监控 | 限流 | PROVIDER_GAP | 当前 API 事实表没有限流结果字段 |
| API 监控 | Merchant 维度 | PASS | Merchant 条件、Top10 和聚合结果已实施 |
| 交易链路 | TransactionId 可查 | PASS | `transaction_locator` 精确定位 |
| 交易链路 | MerchantOrderNo 可查 | PASS | 时间范围内定位最近交易 |
| 交易链路 | ChannelOrderNo 可查 | PASS | 渠道请求表定位 TransactionId |
| 交易链路 | TraceId 可查 | PASS | Merchant API/渠道交互日志定位 |
| 交易链路 | 时间线完整 | DEVIATION | 已覆盖现有结构化业务事件；完整分布式 Span 需 APM 提供方 |
| 交易链路 | 错误节点明确 | PASS | 失败状态、错误码、脱敏错误信息和 Waterfall 状态均展示 |
| 渠道健康 | 成功率 | PASS | 渠道请求事实聚合 |
| 渠道健康 | P95 | PASS | 数据库百分位计算 |
| 渠道健康 | Timeout | PASS | 请求状态及平台结果码识别 |
| 渠道健康 | 连续失败 | PASS | 最近成功点之后失败数统计 |
| 渠道健康 | 错误码 Top | PASS | Top10 数据库聚合与页面联动 |
| 渠道健康 | 国家/地区维度 | PROVIDER_GAP | `transaction_channel_request` 没有已验证的国家/地区字段或关联来源，未猜测地域 |
| Webhook | 成功率 | PASS | 通知尝试日志时间桶聚合 |
| Webhook | 重试 | PASS | Retry/DLQ 趋势、尝试次数和下一次重试时间 |
| Webhook | HTTP 状态 | PASS | 通知尝试日志真实 HTTP Status |
| Webhook | 最终状态 | PASS | 通知任务状态与最近尝试合并展示 |
| Webhook | 人工重试审计 | PASS | 独立权限、`@OperationLog`、稳定 `requestId`、可靠 MQ Outbox |
| 日志 | TraceId 检索 | PASS | Merchant API、渠道交互与安全事件过滤 |
| 日志 | TransactionId 检索 | PASS | 四类交易结构化事件过滤 |
| 日志 | Merchant 检索 | PASS | API、Webhook、安全事件过滤 |
| 日志 | 服务过滤 | PASS | 聚合后统一服务名过滤 |
| 日志 | ERROR 过滤 | PASS | 统一日志级别过滤 |
| 日志 | 时间范围限制 | PASS | 默认 24 小时、最大 7 天、时区校验 |
| 安全拦截 | TransactionId 检索 | PROVIDER_GAP | `security_intercept_event` 当前没有 TransactionId 字段，未伪造交易关联 |
| 告警 | 未处理 | PASS | `OPEN` 状态与摘要 |
| 告警 | 处理中 | PASS | `PROCESSING` 状态和写操作 |
| 告警 | 已恢复 | PASS | 来源恢复状态优先，禁止人工回退 |
| 告警 | 已关闭 | PASS | `CLOSED` 状态和写操作 |
| 告警 | 负责人 | PASS | 接手时记录账号 ID 与姓名 |
| 告警 | 处理记录 | PASS | `monitor_alert_handle_history` 持久化并展示 |
| 安全 | 所有接口鉴权 | PASS | 新工作台、在线用户和安全事件接口均有权限注解 |
| 安全 | 敏感字段脱敏 | PASS | 凭据、PAN、CVV/CVC、URL 密钥参数统一清洗并限制长度 |
| 安全 | 高风险操作审计 | PASS | 告警处置、强制下线、Webhook 重发、安全事件标记/导出均审计 |
| 性能 | 不影响核心支付 | PASS | Admin 侧只读聚合；未向核心链路写高频监控数据 |
| 性能 | 日志查询有限制 | PASS | 最大 7 天、SQL 5 秒超时、候选上限 1000、分页上限 500 |
| 性能 | Redis 扫描受控 | PASS | 沿用受控扫描、分页和独立删除权限 |
| 性能 | 高基数 Tag 受控 | PASS | 未新增 Metrics 高基数 Tag；SQL 分类 TopN 有固定上限 |

## 31. 最终结论

系统监控工作台、受控图表架构、真实数据聚合、菜单权限、告警生命周期、安全控制和测试基线均已落地。当前剩余项不是用 Mock 可补齐的前端缺口，而是 Prometheus、Loki/Elasticsearch、SkyWalking/OpenTelemetry、RocketMQ Admin、线程池绑定以及各基础设施历史指标等真实提供方能力。

在这些提供方未配置前，系统保持可运行、可审计、无伪造数据，并通过 `NOT_CONFIGURED`、空态和本文 `PROVIDER_GAP` 记录真实边界。

第 30 章共 57 项验收结果：`50 PASS`、`6 PROVIDER_GAP`、`1 DEVIATION`。六项能力缺口分别为线程池指标、API HTTP 4xx、API HTTP 5xx、API 限流指标、渠道国家/地区维度和安全事件 TransactionId；唯一差异为交易链路基于当前结构化业务事件实现时间线，而不是声明为完整分布式 APM Span。
