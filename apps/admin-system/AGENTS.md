# Vexra Admin Rules

## Ownership

`apps/admin-system` is the operator-facing administration application. It uses Element Plus and the
existing backend-driven menu, route, permission, store, request, i18n, and theme systems.

## P0/P1 Rules

- Main list pages use the Admin `StandardTable` with a stable Admin-specific `table-key`. Keep the
  column-settings entry in the existing right toolbar with refresh/search controls, not in the form.
- Selection, stable business identity, and action columns remain fixed/non-hideable when required by
  the workflow. A raw table is acceptable for a small modal, role-selection, diagnostic, or preview
  table when preference persistence would add no value.
- Render concrete timestamps with Admin `BaseDateTime` or the shared formatter.
- Dialog footers use the global centered `.dialog-footer`. Create/edit/action dialogs place the
  primary action before cancel; view dialogs center the close action.
- Button, dialog, status, validation, table, and permission-dependent text uses existing i18n keys.
- Menus, routes, tabs, breadcrumbs, buttons, and field visibility remain driven by backend permissions.
  Do not add static fallback business menus or fake operational metrics.
- Navigation theme settings must affect supported sidebar and top-navigation modes through shared
  settings, not page-local colors.
- The top-right user menu keeps a real Profile entry backed by current session/APIs. Do not invent
  account or password endpoints.
- Sensitive fields require backend authorization/redaction; hiding a column is not access control.

## Verification

Run Admin typecheck/build and any affected governance script. For UI behavior, verify permissions,
both navigation modes when affected, table preference restore/reset, dialog focus/actions, i18n, and
desktop layout with the real backend flow where available.
