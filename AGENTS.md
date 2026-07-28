# AGENTS.md

# Acquiring Frontend AI Development Guide

## Project Overview

This repository is the frontend project for a global payment and acquiring platform.

Backend repository:

acquiring-orchestration

Frontend repository:

acquiring-frontend

This repository contains frontend applications only.

Do not generate backend Java code.

------

## Technology Stack

Required:

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios

Admin Applications:

- Element Plus

Admin table and layout rules:

- Standard list pages in `apps/admin-system` must use the shared `<StandardTable>` capability instead of page-local hardcoded column settings.
- Main list tables must use `<StandardTable table-key="stable-table-key">` so column width, column visibility, column order, reset, and user preference persistence are available consistently.
- The edit-columns entry belongs in the existing right toolbar area, together with refresh and search toggles. Do not place it in the search form.
- When a table has few visible columns, it must stretch columns across the available list width; when columns exceed the container width, it must keep readable widths and use internal horizontal scrolling.
- Fixed business identity columns, selection columns, and operation columns must not be hidden unless the business explicitly confirms that they are optional.
- Modal result tables, small diagnostic tables, and one-off preview tables may opt out, but the reason must be clear from surrounding code or review notes.
- Keep the detailed standard in `/Users/scott/Documents/code/ideaCodex/acquiring-orchestration/docs/standards/frontend-layout-table-standard.md` aligned when changing shared table behavior.

Merchant table and layout rules:

- Standard list pages in `apps/merchant-portal` must use the merchant-local `<StandardTable>` capability instead of page-local hardcoded table behavior.
- Main list tables must use `<StandardTable table-key="stable-table-key">` so column width, column visibility, column order, reset, and merchant-user preference persistence are available consistently.
- The edit-columns entry belongs in the existing right toolbar area, together with refresh and search toggles. Do not place it in the search form.
- Merchant table preference storage must use the merchant namespace and must not reuse the admin-system localStorage prefix.
- When a table has few visible columns, it must stretch columns across the available list width; when columns exceed the container width, it must keep readable widths and use internal horizontal scrolling.
- Time columns such as created time, updated time, operated time, login time, and other concrete timestamps must be rendered on one line with the merchant `BaseDateTime` component or the same formatting rule.
- Fixed business identity columns, selection columns, and operation columns must not be hidden unless the business explicitly confirms that they are optional.
- Modal result tables, small diagnostic tables, and one-off preview tables may opt out, but the reason must be clear from surrounding code or review notes.
- Merchant pages must be driven by real backend menus and permissions. Do not reintroduce mock dashboard, placeholder pages, or static fallback business menus.
- `apps/merchant-portal` may provide a real `/home` entry page, but it must be driven by the current login session, account, roles, permissions, and backend menu data. Do not show fake transaction, settlement, or risk metrics on the merchant home page.
- Merchant login and shell visual styling must stay aligned to the merchant blue-green brand palette. Avoid drifting into a pure green one-note palette inside cards, chips, buttons, and helper text.
- Merchant list table body cells should be centered by default unless a column has a clear readability reason to opt out.
- Admin and Merchant must both expose a real `个人中心 / Profile` entry from the top-right user menu. Do not add it as a normal sidebar business menu unless the product explicitly asks for that.
- Profile center pages must use the current authenticated session and existing APIs only. Do not invent profile update or password APIs; if backend endpoints are unavailable, keep validation in the frontend and show a clear pending-integration message.
- Admin navigation theme settings must affect both sidebar and top navigation styles. Theme options should come from shared constants instead of page-local hardcoded radio values.

Admin dialog rules:

- All `el-dialog` footers in `apps/admin-system` must use the shared centered footer style.
- Use a `.dialog-footer` wrapper for dialog footer buttons.
- Create/edit/action dialogs must show the primary confirm action first, then cancel.
- Detail/view dialogs with only a close action must show the close button centered.
- Do not create page-local right-aligned dialog footer styles. Reuse the global dialog footer rules in `apps/admin-system/src/styles/main.css`.
- Do not hardcode dialog button text such as `确定`, `取消`, or `关闭`; use existing i18n keys such as `common.confirm`, `common.cancel`, and `common.close`.

Merchant dialog rules:

- All `el-dialog` footers in `apps/merchant-portal` must use the shared centered footer style.
- Use a `.dialog-footer` wrapper for dialog footer buttons.
- Create/edit/action dialogs must show the primary action first, then cancel. Save dialogs may use `common.save`; confirmation dialogs should use `common.confirm`.
- Detail/view dialogs with only a close action must show the close button centered.
- Do not create page-local right-aligned dialog footer styles. Reuse the global dialog footer rules in `apps/merchant-portal/src/styles/main.css`.
- Do not hardcode dialog button text such as `确定`, `取消`, or `关闭`; use existing i18n keys such as `common.confirm`, `common.save`, `common.cancel`, and `common.close`.

Hosted Checkout Application:

- Tailwind CSS

Do not introduce:

- React
- Angular
- jQuery
- Bootstrap
- Ant Design

unless explicitly requested.

------

## Repository Structure

apps/
├── admin-system
├── merchant-portal
└── hosted-checkout

packages/
├── components
├── api
├── hooks
├── utils
├── constants
├── types
└── layouts

docs/

------

## Repository Scope

- `apps/admin-system` is the admin management system.
- `apps/merchant-portal` is the merchant portal.
- `apps/hosted-checkout` is the hosted checkout / cashier application.
- `packages/shared` is the confirmed shared workspace package exported as `@acquiring/shared`.
- Other `packages/*` directories may exist as structure placeholders. Do not treat them as buildable packages unless they contain their own `package.json` and exported source.

## Build Baseline

- Follow the current Vue, TypeScript, Vite, Pinia, Vue Router, Element Plus and Tailwind versions declared in the root and app `package.json` files.
- The root package uses npm workspaces. `pnpm-workspace.yaml` and `pnpm-lock.yaml` also exist, so the primary package manager must be confirmed before changing dependency workflow.
- Do not upgrade frontend dependencies unless the user explicitly approves the version and impact scope.
- After frontend changes, run the relevant app `typecheck` and `build` scripts. If a `lint` script is unavailable, record that gap instead of inventing a passing lint result.

## Development Principles

## Vexra Brand System

- Frontend primary brand is fixed as `Vexra`.
- Admin must use `Vexra Admin`.
- Merchant must use `Vexra Merchant`.
- Hosted Checkout must use `Vexra Checkout`.
- Do not introduce alternative primary brand names or mix historical names into login pages, sidebars, headers, browser titles, or favicon resources.
- Prefer shared brand configuration and shared assets over scattering brand copy across pages.
- Use formal SVG assets for logo and favicon resources. Do not replace them with screenshots, text placeholders, or ad-hoc CSS art.
- Browser tab icons should use the shared Vexra icon resource unless the user explicitly asks for another approved variant.

### Never Invent Business Logic

Always reuse:

- Existing APIs
- Existing enums
- Existing types
- Existing status definitions

If business logic is unclear:

Create TODO.

Do not guess.

------

### Never Invent API Endpoints

Before creating API functions:

1. Search existing api directory.
2. Search documentation.
3. Search backend OpenAPI.

If endpoint cannot be found:

Ask for clarification or create TODO.

### Backend Contract First

- Interfaces, enums, statuses, permissions and error codes must follow the backend contract from `acquiring-orchestration` or confirmed API documentation.
- Do not forge backend response fields to make a page render.
- Do not redefine shared business enums inside page components. Reuse existing app constants, shared package types, or backend-confirmed definitions.
- Keep existing menu, permission, route, store and request-interceptor systems. Do not bypass them for a single page.
- Do not reintroduce mock business menus, fake transaction metrics, fake settlement data, fake risk data or static fallback business data unless the user explicitly asks for a prototype.

------

### Never Invent Status Values

Forbidden:

DONE
COMPLETE
FINISHED

Use existing project enums only.

### Sensitive Data

- Do not write card data, CVV, JWT, Token, API keys, merchant secrets, decrypted payloads or full sensitive responses to browser logs.
- Do not persist sensitive data in `localStorage`, `sessionStorage`, IndexedDB or cookies unless the existing security design explicitly allows it.
- Hosted Checkout changes must consider both desktop and mobile viewports, especially payment form layout, locale/country selection, error states and sensitive data handling.

### Change Control

- Do not perform unrelated page refactors, broad style rewrites or dependency churn.
- Keep Admin and Merchant table, dialog, profile, route and permission behavior aligned with the existing app-specific rules above.
- When backend endpoints are unavailable, surface a pending-integration state or TODO; do not silently fake the contract.

------

### Vue Rules

Use:
