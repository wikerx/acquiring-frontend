---
name: acquiring-frontend-development
description: Implement, refactor, review, or browser-verify Vue and TypeScript changes in the acquiring-frontend repository, including Vexra Admin, Merchant, Hosted Checkout, shared components, API integration, permissions, tables, dialogs, routing, i18n, and responsive behavior. Do not use for backend Java or the merchant Java SDK.
---

# Acquiring Frontend Development

Use the repository and application `AGENTS.md` files as the decision boundary. This Skill defines
how to execute frontend work.

## Establish The Contract

1. Read the root and closest application-level `AGENTS.md`.
2. Inspect the existing page/component, API module, types, route, store, permissions, i18n, styles,
   shared components, and relevant backend contract.
3. Classify the change as `P0/P1/P2` and `R0/R1/R2/R3`.
4. For shared, security-sensitive, checkout, or visually significant work, read
   [frontend change checklist](references/frontend-change-checklist.md).

Never create a field, endpoint, status, permission, or fake record merely to complete a UI.

## Confirmation Gate

Before editing, state:

- user workflow and non-goals;
- affected apps, shared packages, APIs, and files;
- contract evidence and any missing backend capability;
- responsive, permission, i18n, security, and compatibility risk;
- typecheck/build and browser-verification plan.

Wait for explicit approval and keep implementation inside that scope.

## Implementation

- Preserve existing user changes and avoid broad style or dependency churn.
- Reuse application-local shared capabilities before creating another abstraction.
- Keep UI state separate from server facts; do not convert display labels into business logic.
- Implement loading, empty, error, disabled, permission, and long-content states where relevant.
- Keep sensitive values out of logs, browser storage, URLs, analytics, and screenshots.
- Update i18n and types together with behavior.

Use `$frontend-design` when the task changes visual composition or interaction design. Use real
browser verification when the rendered result or flow changes.

## Verification And Handoff

Run the affected workspace's typecheck/build first. Then verify the changed flow at representative
viewports when applicable, checking console/network errors, overlap, text fit, focus, permissions,
i18n, table/dialog behavior, and sensitive-data exposure.

Report exact commands and outcomes. Do not claim lint passed because this repository currently has no
general lint script. Summarize changed files, API/permission impact, browser evidence, and unverified
risk.
