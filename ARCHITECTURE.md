# BARBER Architecture Guide

## Goals
- Keep business logic out of page files when possible.
- Prefer feature-based structure over giant page components.
- Make UI components mostly presentational.
- Centralize fetch/state logic in hooks.
- Keep backend split into routes → services → repositories.

## Frontend Structure

### Rule of thumb
- `pages/` = composition only
- `features/<feature>/use*.ts` = state, fetch, workflow
- `features/<feature>/*.tsx` = feature UI pieces
- `components/` = shared UI/layout
- `lib/` = shared infra/helpers
- `types.ts` = shared domain types

### Current feature boundaries
- `src/features/booking/*`
  - booking flow state
  - booking utilities
  - booking step components
- `src/features/admin/*`
  - dashboard state
  - dashboard filtering/utils
  - dashboard UI sections

## Backend Structure
- `routes/` should validate and delegate
- `services/` should contain business logic
- `repositories/` should own database access
- avoid putting SQL in routes
- avoid putting HTTP concerns in repositories

## Development Rules
1. Do not grow page files into all-in-one controllers.
2. If a page passes ~200 lines, check whether a feature hook or subcomponent should be extracted.
3. If logic is reused or stateful, prefer a custom hook.
4. If markup is large but dumb, prefer a presentational component.
5. Keep formatting/date/status helper logic in utility files, not inline in pages.
6. Preserve a single source of truth for each workflow state.
7. Before adding a new admin/customer feature, decide its feature folder first.

## Refactor outcomes applied
- `CustomerPortal.tsx` reduced to page composition around `useBookingFlow` and booking components.
- `AdminDashboard.tsx` reduced to page composition around `useAdminDashboard` and dashboard components.
- Booking and admin logic now live in dedicated feature modules.

## Preferred next steps
- Move admin auth handling to a dedicated auth hook/store.
- Add API client modules per feature instead of calling raw endpoints everywhere.
- Add lightweight tests for booking flow utils and dashboard filters.
- Consider React Query for admin/booking server state if the app keeps growing.
