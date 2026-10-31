# Acquiring Frontend Development Rules

## Scope

This repository contains the Vexra Admin, Merchant, and Hosted Checkout Vue applications plus shared
frontend code. These rules apply to all frontend source, tests, build configuration, and technical
documentation. A closer application-level `AGENTS.md` adds rules for that application.

## Source Of Truth

Resolve conflicts in this order:

1. The user's approved requirement and approved UX/API contract.
2. The backend's versioned API models, permissions, error/status definitions, and executable tests.
3. The closest applicable `AGENTS.md`.
4. Maintained frontend standards and architecture documents.
5. Historical migration plans, screenshots, examples, and generic guidance.

Do not choose a rule only because it sounds stricter. If a decision invents an endpoint, field,
status, permission, amount meaning, or security behavior, stop and obtain a contract decision.

## Requirement And Risk Levels

- `P0`: blocking security, contract, money-display, permission, or data-integrity invariant.
- `P1`: mandatory for new and touched code; unrelated legacy violations remain technical debt.
- `P2`: recommendation that may be applied inside the approved scope.
- `R0`: documentation only; `R1`: local UI implementation; `R2`: shared component, API, auth,
  permission, routing, storage, or cross-app behavior; `R3`: checkout, sensitive payment data,
  cryptography, or externally visible transaction behavior.

`R2/R3` require impact analysis and focused regression evidence. `R3` requires desktop and mobile
verification plus a containment/rollback note.

## Mandatory Workflow

Before editing:

1. Read this file and the closest application `AGENTS.md`.
2. Inspect existing components, API functions, types, stores, routes, permissions, i18n, and tests.
3. Confirm the backend contract instead of deriving it from a mock or desired screen.
4. State affected files, risk, non-goals, and verification, then obtain explicit approval.
5. Preserve all existing user changes and avoid unrelated formatting or style rewrites.

After editing, run fresh targeted type checking/build checks and browser verification when behavior or
layout changed. Report failures and skipped checks accurately; do not use old output as evidence.

## Technical Baseline

- Vue 3, TypeScript strict mode, Vite, Pinia, Vue Router, Axios, and Vue I18n.
- Admin and Merchant use Element Plus; Hosted Checkout uses its existing lightweight/Tailwind setup.
- `@acquiring/shared` is the confirmed shared workspace package. Other `packages/*` directories are
  not buildable unless they contain a package manifest and exported source.
- Current executable workspace scripts use npm workspaces and `package-lock.json`; use npm for normal
  verification. `pnpm-workspace.yaml` and `pnpm-lock.yaml` coexist, but do not update both lockfile
  ecosystems or change the package-manager workflow without explicit approval.
- Do not upgrade dependencies or introduce another UI framework without an approved need and impact
  analysis.

## P0 Frontend Invariants

### Backend Contract First

- Reuse existing API functions, types, enums, statuses, result models, permissions, and error codes.
- Never invent an endpoint, response field, status, permission, transaction result, or fallback
  business record to make a page render.
- If a backend capability is unavailable, show an honest unavailable/pending-integration state or
  leave an explicit TODO tied to a contract decision.
- Do not duplicate shared business enums inside page components or compare business decisions by
  display text.

### Security And Privacy

- Never log or persist PAN, CVV, JWT, access/refresh tokens, API keys, merchant secrets, decrypted
  payloads, complete payment responses, or unredacted identity/bank data.
- Browser storage is not an authorization boundary. Column settings and layout preferences cannot
  grant field access or reveal data omitted by permissions.
- Keep authentication, route guards, button permissions, field permissions, request interceptors,
  CSRF/origin policy, and error handling in the established shared paths.
- Do not render raw HTML or external URLs without the existing sanitization/origin policy.

### Money, Status, And Time

- Treat monetary values as contract strings or exact minor units; do not perform financial decisions
  with JavaScript floating point.
- Display currency, sign, exponent, and transaction status from confirmed contract data.
- Concrete timestamps use the shared formatter or `BaseDateTime` and display
  `yyyy-MM-dd HH:mm:ss` unless the product explicitly requires another format. Do not truncate with
  `substring` or ask the backend to discard precision.

## Component And UX Rules

- Reuse existing layout, form, table, dialog, feedback, loading, empty, and error-state patterns.
- Main list pages use the application-local `StandardTable` with a stable `table-key`. Small modal,
  diagnostic, virtual, or preview tables may use a raw table when column preferences are not useful.
- Column preferences affect presentation only. Fixed identity, selection, permission-sensitive, and
  action columns follow the application rules and cannot become a data-permission bypass.
- User-visible copy uses i18n. Do not hardcode duplicated button, status, validation, or dialog text.
- Preserve menu, route, tab, breadcrumb, permission, theme, and profile behavior.
- UI changes include loading, empty, error, disabled, permission-denied, long-content, and responsive
  states where applicable.
- Do not perform broad visual redesign or remove an entry/function without explicit approval.

## Verification Baseline

Use the relevant existing commands:

```bash
npm run typecheck
npm run build:admin
npm run build:merchant
npm run build:checkout
```

Run only affected apps first. If rendered behavior changes, verify the real flow in a browser at
representative desktop and mobile viewports. Check console errors, network failures, text overflow,
overlap, keyboard/focus behavior, permissions, and sensitive-data exposure.

The repository currently has no general `lint` script. Record that gap; never report lint as passing.

## Documentation And Skill

- Durable frontend rules belong in `docs/standards`; do not add a Markdown report for a small change.
- Historical migration plans are context, not permanent execution instructions.
- Use `$acquiring-frontend-development` from
  `.agents/skills/acquiring-frontend-development` for implementation, refactoring, review, or UI
  verification in this repository.
