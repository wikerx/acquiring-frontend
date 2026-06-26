# Frontend Auth Hardening

## Current State

- Admin and merchant portals keep Bearer token login state in `localStorage` in this phase.
- Request interceptors attach the token as `Authorization: Bearer <token>`.
- Response interceptors clear local login state and redirect to login on HTTP 401.

## Required Guardrails

- Do not use `v-html` for untrusted content.
- Dynamic menu names, external links, rich text, and any server-provided HTML must be sanitized before rendering.
- Keep third-party scripts and inline scripts out of admin and merchant portals unless reviewed.
- Deploy with a restrictive Content-Security-Policy. Suggested baseline:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https://api.xxx.com;
frame-ancestors 'self';
object-src 'none';
base-uri 'self';
```

## Next Auth Upgrade

- Move admin and merchant login state from `localStorage` to `HttpOnly; Secure; SameSite=Lax` or stricter cookies.
- Add CSRF protection when cookie-based login is enabled.
- Keep Bearer token compatibility only during a controlled migration window.
