# Frontend Change Checklist

Read this reference for R2/R3, shared component, authentication, permission, routing, storage,
checkout, responsive, or significant UI work.

## Ready To Start

- User workflow, audience, success state, failure state, and non-goals are explicit.
- Backend endpoint, method, request/response fields, statuses, errors, and permissions are confirmed.
- Existing shared components, stores, routes, i18n, utilities, and application conventions are known.
- Desktop/mobile, accessibility, sensitive-data, migration, and rollback needs are classified.
- Verification can use a real flow or its unavailable dependencies are stated.

## Contract And State

- Do not use a display label as a status or permission.
- Keep server facts, request state, form state, and presentation preferences separate.
- Handle missing/extra optional fields compatibly; do not fabricate required data.
- Preserve request interceptors, cancellation, error normalization, and authentication behavior.
- A payment or asynchronous operation distinguishes success, decline, pending, unknown, and technical
  error according to the backend contract.

## Security

- No secrets, tokens, PAN/CVV, decrypted data, full bank/identity data, or complete payment payloads
  in logs, URLs, browser storage, errors, analytics, fixtures, or screenshots.
- Client-side visibility is not authorization. The server controls data and actions.
- External URLs/frames, HTML, redirects, return URLs, and origins use the established allowlist or
  sanitization policy.
- Checkout prevents unsafe duplicate submission and never silently retries an uncertain payment.

## UX

- Cover loading, empty, partial, error, permission-denied, disabled, long-content, and retry/recovery
  states as applicable.
- Use i18n for visible copy and verify both maintained locales when keys change.
- Tables preserve fixed/action/identity behavior, scroll and preference reset/compatibility.
- Dialogs preserve focus, close behavior, action order, validation, submitting state, and error
  recovery.
- Check text wrapping, overflow, overlap, keyboard access, focus visibility, and viewport changes.
- Visual changes remain consistent with the application's design system and domain, not a generic
  template.

## Verification

```bash
npm --workspace @acquiring/admin-system run typecheck
npm --workspace @acquiring/admin-system run build
npm --workspace @acquiring/merchant-portal run typecheck
npm --workspace @acquiring/merchant-portal run build
npm --workspace @acquiring/hosted-checkout run typecheck
npm --workspace @acquiring/hosted-checkout run build
```

Run only affected workspaces first. Shared-package changes also require the shared typecheck and each
affected consuming app.

For rendered changes, verify representative desktop and mobile viewports and inspect:

- console exceptions and warnings;
- failed/duplicated network requests;
- missing translations and route/permission behavior;
- layout overlap, clipping, unstable dimensions, and text fit;
- keyboard/focus and primary task completion;
- sensitive information in DOM, storage, URL, console, and network diagnostics.

State when backend/environment access prevents an end-to-end result.
