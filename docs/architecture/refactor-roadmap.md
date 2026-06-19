# Frontend Refactor Roadmap

## Goal

The frontend repositories should evolve toward a consistent enterprise structure shared by `admin-system`, `merchant-portal`, and future cashier flows.

Primary goals:

1. Keep pages focused on presentation and user interaction.
2. Keep API protocol handling inside API modules.
3. Keep auth/session handling inside stores and shared helpers.
4. Reuse `packages/shared` as the single source for common request, result, and auth primitives.

## Current Observations

1. `admin-system` already behaves closer to the target model: API modules usually unwrap backend `CommonResult` and stores consume business objects.
2. `merchant-portal` still lets pages and router guards unwrap `CommonResult`, which leaks transport protocol details outside the API layer.
3. The two apps use different request patterns even though they already share `createHttpClient`.
4. Root-level local proxy documentation has drifted from actual Vite configuration.

## Target Structure

```text
apps/<app>/src
├── api
├── stores
├── router
├── layouts
├── pages or views
└── styles

packages/shared/src
├── auth
├── http
├── result
├── types
└── utils
```

## Phase 1

1. Normalize `merchant-portal` API modules so they return business objects instead of raw `CommonResult`.
2. Keep router guards and pages unaware of `CommonResult`.
3. Keep session persistence logic in stores.

## Next Phases

1. Move `admin-system` off its legacy local axios wrapper and align it with `packages/shared`.
2. Extract shared auth storage helpers into `packages/shared`.
3. Introduce shared menu mapping and route guard helpers for admin and merchant applications.
