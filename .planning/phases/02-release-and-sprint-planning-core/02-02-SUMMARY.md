---
phase: 02-release-and-sprint-planning-core
plan: "02"
subsystem: ui
tags: [nextjs, react, server-components, prisma, playwright]

# Dependency graph
requires:
  - phase: 02-release-and-sprint-planning-core
    provides: "Release creation, sprint generation, and active-release guard"
provides:
  - Release detail and update API with sprint reconciliation
  - Release list, detail, and edit UI screens
  - Active release context in global app header
  - End-to-end browser tests for release management
affects:
  - 02-03 (Sprint list and editing)
  - 03 (Feature/Story planning)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component for header data fetching, client component for pathname-based navigation"
    - "AppShell split pattern: AppSidebar (usePathname client) + AppHeader (async server)"

key-files:
  created:
    - src/app/releases/[id]/page.tsx
    - src/app/releases/[id]/edit/page.tsx
    - src/features/releases/release-detail.tsx
    - src/features/releases/release-edit-form.tsx
    - src/components/app-header.tsx
    - src/components/app-sidebar.tsx
    - tests/e2e/release-management.spec.ts
  modified:
    - src/lib/releases.ts
    - src/app/api/releases/[id]/route.ts
    - src/features/releases/release-list.tsx
    - src/components/ui/button.tsx
    - src/components/app-shell.tsx
    - tests/releases.test.ts

key-decisions:
  - "Split AppShell into server (AppShell + AppHeader) and client (AppSidebar) components to allow server-side active release fetching without breaking pathname-based navigation"
  - "Use Badge tone='success' for 'In progress' status and tone='warning' for capacity placeholder in the header"

patterns-established:
  - "Server/Client split in layout shell: data-fetching header is async server component, navigation sidebar is 'use client' with usePathname"
  - "Button asChild pattern for Link-wrapped icon buttons in action columns"

requirements-completed:
  - REL-01
  - REL-02
  - REL-03
  - REL-04

# Metrics
duration: 23min
completed: 2026-06-03
---

# Phase 2 Plan 02: Release And Sprint Planning Core Summary

**Full release management UI with detail/edit screens, sprint reconciliation API, and active release context in the global header using Next.js server/client component split**

## Performance

- **Duration:** 23 min
- **Started:** 2026-06-03T23:20:00Z
- **Completed:** 2026-06-03T23:43:00Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Release detail and update API (`GET`/`PATCH` in `/api/releases/[id]`) with automatic sprint reconciliation
- `getReleaseDetails`, `updateRelease`, `getActiveReleaseSummary`, and `reconcileGeneratedSprints` in `src/lib/releases.ts`
- Release list upgraded with status badges, meeting/support columns, and view/edit action buttons
- Release detail page showing objective, period, status, meeting/support percentages, sprint count, and generated sprints table with capacity placeholders
- Release edit form with inline validation, PATCH submission, and redirect-after-save
- Global header displays active `IN_PROGRESS` release name, status badge, and capacity placeholder
- 16 unit tests and 4 e2e tests covering release detail, update, sprint reconciliation, and header context

## Task Commits

Each task was committed atomically:

1. **Task 1: Add release detail and edit APIs with sprint reconciliation** - `f6bd080` (feat)
2. **Task 2: Build release list, detail, and edit screens** - `0daa6e4` (feat)
3. **Task 3: Show the persisted active release in the global header** - `e01e74f` (feat)

**Plan metadata:** `e01e74f` (final commit includes Task 3)

## Files Created/Modified
- `src/app/api/releases/[id]/route.ts` - GET release detail and PATCH update with 404/400 errors
- `src/lib/releases.ts` - getReleaseDetails, updateRelease, getActiveReleaseSummary, reconcileGeneratedSprints, toActiveReleaseSummary
- `tests/releases.test.ts` - Unit tests for detail, update, active summary, and sprint reconciliation
- `src/app/releases/[id]/page.tsx` - Server-rendered release detail route
- `src/app/releases/[id]/edit/page.tsx` - Server-rendered release edit route
- `src/features/releases/release-detail.tsx` - Detail component with sprint table and capacity placeholders
- `src/features/releases/release-edit-form.tsx` - Edit form with PATCH submission and inline validation
- `src/features/releases/release-list.tsx` - Updated with view/edit actions and meeting/support columns
- `src/components/ui/button.tsx` - Added `asChild` prop for Link-wrapped buttons
- `src/components/app-shell.tsx` - Refactored to server component composing sidebar + header
- `src/components/app-header.tsx` - Async server component fetching active release for header
- `src/components/app-sidebar.tsx` - Client component with `usePathname` for navigation
- `tests/e2e/release-management.spec.ts` - E2E tests for create, detail, edit, list columns, sprint placeholders, and header context

## Decisions Made
- Split AppShell into server (AppShell + AppHeader) and client (AppSidebar) components to allow server-side active release data fetching while preserving pathname-based navigation
- Used Badge tone='success' for active release status and tone='warning' for capacity placeholder

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Killed stale Next.js dev server blocking all e2e tests**
- **Found during:** Task 3 verification (e2e test execution)
- **Issue:** A stale Next.js dev server process on port 3000 was not serving client-side JS chunks (`_next/static/chunks/...` returned 404), causing all browser fetch submissions to fail silently and all e2e tests to timeout
- **Fix:** Used PowerShell `Stop-Process` to terminate the stale server process so Playwright could start a fresh dev server
- **Files modified:** None (environment fix)
- **Verification:** All e2e tests pass after server restart
- **Committed in:** No separate commit — environment fix applied before Task 3 commit

---

**Total deviations:** 1 auto-fixed (1 blocking environment issue)
**Impact on plan:** No code changes required. Fix was purely environmental.

## Issues Encountered
- Stale Next.js dev server on port 3000 prevented client-side JavaScript from loading, breaking all e2e form submissions. Resolved by terminating the process and allowing Playwright to start a fresh server.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 02-03: Sprint list and editing screens
- Release management foundation is complete with validated API, UI, and browser coverage
- Active release header context is wired and ready for Phase 4 capacity integration

## Self-Check: PASSED

- [x] All key files exist on disk (7/7 checked)
- [x] All commits exist in git history (3 commits for 02-02)
- [x] `npm run test -- releases` passes (16/16)
- [x] `npm run build` exits 0
- [x] `npm run test:e2e -- release-management` passes (4/4)

---
*Phase: 02-release-and-sprint-planning-core*
*Completed: 2026-06-03*
