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

------

### Never Invent Status Values

Forbidden:

DONE
COMPLETE
FINISHED

Use existing project enums only.

------

### Vue Rules

Use:
