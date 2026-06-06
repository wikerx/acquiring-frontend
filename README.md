# Acquiring Frontend

支付收单平台前端独立仓库，后端仓库为 `wikerx/acquiring-orchestration`。

## 目录

- `apps/admin-system`：平台管理后台，Vue 3 + Element Plus。
- `apps/merchant-portal`：商户管理系统，Vue 3 + Element Plus。
- `apps/cashier`：收银台应用，Vue 3 + Tailwind CSS。
- `packages/shared`：统一请求、鉴权、类型和工具。

## 命令

```bash
npm install
npm run dev:admin
npm run dev:merchant
npm run dev:cashier
npm run typecheck
npm run build
```

## 本地代理

- `admin-system` 默认启动在 `http://localhost:5173`，代理 `/admin` 到 `http://127.0.0.1:8000`。
- `merchant-portal` 默认启动在 `http://localhost:5174`，代理 `/merchant` 到 `http://127.0.0.1:8002`。
- `cashier` 默认启动在 `http://localhost:5175`，预留 `/checkout` 到 `http://127.0.0.1:8000`。

## 接口边界

当前已对接后端已有接口：

- 管理后台登录、当前用户、退出登录。
- 系统配置查询、保存、删除。
- 字典类型和字典数据查询、保存、删除。
- 操作日志查询。
- 商户端登录、当前用户、退出登录。

尚未在后端提供管理接口的商户、交易、结算、风控等页面只保留标准列表空态，不臆造接口。
