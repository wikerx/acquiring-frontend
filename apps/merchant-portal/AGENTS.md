# Vexra Merchant Rules

## Ownership

`apps/merchant-portal` is the authenticated merchant workspace. It uses Element Plus and must remain
driven by the current merchant session, roles, permissions, and backend menu data.

## P0/P1 Rules

- Do not reintroduce mock dashboards, placeholder business pages, static fallback menus, or fake
  transaction, settlement, balance, or risk metrics.
- Main list pages use the Merchant `StandardTable` with a stable Merchant-specific `table-key`.
  Merchant preference keys must never reuse the Admin storage namespace.
- Merchant list body cells are centered by default unless a column has a documented readability or
  numeric-alignment reason. Keep identity/action columns protected as required.
- Render concrete timestamps with Merchant `BaseDateTime` or the shared formatter.
- Dialog footers use the global centered `.dialog-footer`; use i18n keys for save/confirm/cancel/close.
- Menus, routes, actions, profile data, and fields follow merchant backend permissions. Do not infer
  platform-admin abilities from a similar Admin screen.
- Keep login and application shell aligned with the established Vexra Merchant brand system; avoid
  page-local redesign or a one-color palette that breaks the existing shell.
- The Profile entry uses current session and existing APIs. Missing update/password APIs are shown as
  pending integration rather than invented.
- Never expose secrets, complete account/bank information, or another merchant's data through local
  filtering, cached table preferences, URL state, or diagnostics.

## Verification

Run Merchant typecheck/build. Verify session/menu/permission behavior, table preference isolation,
empty/error states, dialog actions, i18n, and relevant desktop/responsive layouts against real APIs.
