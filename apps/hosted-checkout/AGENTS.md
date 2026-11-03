# Vexra Hosted Checkout Rules

## Ownership

`apps/hosted-checkout` is the payer-facing checkout. It is a security- and conversion-critical
surface, not a generic Admin page.

## P0 Rules

- Follow the published checkout-session and payment contracts. Do not invent amounts, currencies,
  payment methods, transaction states, redirect behavior, or success results.
- Never log or persist PAN, CVV, payment credentials, decrypted payloads, tokens, or complete payment
  responses. Sensitive form values must not survive longer than required for the approved flow.
- Treat query parameters, return URLs, locale, country, payment method, and server messages as
  untrusted input. Apply the existing origin/URL and rendering policies.
- Never show payment success from an HTTP success alone. Use the confirmed transaction-result contract
  and represent pending/unknown outcomes honestly.
- Prevent accidental duplicate submission while preserving a clear recovery path for timeout or
  unknown outcomes. Do not implement client-side retry that can duplicate a payment.
- Amount and currency display must be exact and consistent across form, confirmation, error, return,
  and receipt views.

## UX And Verification

- Design for payer comprehension: clear merchant identity, amount/currency, payment method, validation,
  processing, challenge/redirect, pending, decline, error, and recovery states.
- Keep the primary checkout scene usable on mobile and desktop without overlap, hidden fields, or
  layout shift. Keyboard, focus, autofill, and accessibility behavior matter.
- Run checkout typecheck/build and verify representative mobile and desktop flows in a real browser,
  including slow/error responses, duplicate clicks, redirect/return, localization, and console/network
  data exposure.
