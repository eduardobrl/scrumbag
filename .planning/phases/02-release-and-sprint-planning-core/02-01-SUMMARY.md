---
phase: 02-release-and-sprint-planning-core
plan: "01"
subsystem: api
tags: [prisma, sqlite, nextjs, react, playwright, sprint-generation]

# Dependency graph
requires:
  - phase: 01-local-foundation-and-squad-setup
    provides: "Next.js app shell, Prisma client, SQLite setup, squad/calendar models"
provides:
  - Release and Sprint Prisma models with status enums
  - Business-day sprint generation algorithm
  - Release create/list API with active-release uniqueness guard
  - Interactive release creation form and list UI
  - Unit and e2e tests covering sprint generation rules and validation
affects:
  - 02-02 (Active release header)
  - 02-03 (Sprint list and editing)
  - 03 (Feature/Story planning)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ValidationResult<T> union type for explicit ok/error handling"
    - "Prisma $transaction for release + sprint atomic creation"
    - "Server action pattern via API routes with client-side form refresh"

key-files:
  created:
    - src/lib/sprint-generation.ts
    - src/lib/releases.ts
    - src/app/api/releases/route.ts
    - src/features/releases/release-form.tsx
    - src/features/releases/release-list.tsx
    - tests/releases.test.ts
    - tests/e2e/releases.spec.ts
  modified:
    - prisma/schema.prisma
    - scripts/db-sync.ts
    - src/app/releases/page.tsx

key-decisions:
  - "Absorb remaining business days into the final sprint instead of creating a very small last sprint"
  - "Prevent multiple IN_PROGRESS releases at the database transaction level before creation"
  - "Fetch holidays from the existing Holiday model and pass them into sprint generation for automatic exclusion"
  - "Use Prisma $transaction to create the Release row and all Sprint rows atomically"
  - "Keep the page.tsx server-rendered with async data fetch, while the form is a client component"

requirements-completed:
  - REL-01
  - REL-02
  - REL-03
  - REL-04

# Metrics
duration: ~28min
completed: 2026-06-03
---

# Phase 2 Plan 01: Release And Sprint Planning Core Summary

**Release creation with automatic sprint generation, active-release uniqueness guard, and end-to-end browser coverage using local SQLite**

## Performance

- **Duration:** ~28 min
- **Started:** 2026-06-03T01:48:00Z
- **Completed:** 2026-06-03T01:58:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Release and Sprint Prisma models with ReleaseStatus and SprintStatus enums
- Business-day sprint generation algorithm excluding holidays, with final-sprint absorption
- Release create/list API with validation and active-release uniqueness enforcement
- Interactive release creation form with all required fields
- Release list table showing name, period, status badge, and sprint count
- Unit tests covering sprint generation rules, holiday exclusion, validation, and duplicate active release rejection
- Playwright e2e test proving release creation, persistence after reload, and duplicate active release error

## Task Commits

Each task was committed atomically:

1. **Task 1: Add release creation slice with generated persisted sprints** - `a6f4146` (feat)
2. **Task 2: Sync Prisma schema to local SQLite database** - Commands executed; schema changes included in Task 1 commit
3. **Task 3: Prove release creation path in the browser** - `3fa6a77` (test)

**Plan metadata:** (to be committed with SUMMARY)

## Files Created/Modified
- `prisma/schema.prisma` - Added Release and Sprint models, ReleaseStatus and SprintStatus enums
- `scripts/db-sync.ts` - Added SQLite CREATE TABLE for Release and Sprint with foreign key and index
- `src/lib/sprint-generation.ts` - Business-day sprint generation with holiday exclusion and final-sprint absorption
- `src/lib/releases.ts` - Release validation, create, list, and view helpers with active-release guard
- `src/app/api/releases/route.ts` - GET /api/releases and POST /api/releases handlers
- `src/features/releases/release-form.tsx` - Client-side release creation form
- `src/features/releases/release-list.tsx` - Server-rendered release list table
- `src/app/releases/page.tsx` - Operational releases page replacing Phase 2 placeholder
- `tests/releases.test.ts` - Unit tests for sprint generation, validation, and duplicate active release prevention
- `tests/e2e/releases.spec.ts` - Playwright e2e tests for release creation, persistence, and duplicate validation

## Decisions Made
- Absorb remaining business days into the final sprint instead of creating a very small last sprint
- Prevent multiple IN_PROGRESS releases at the transaction level before creation
- Pass holidays from the existing Holiday model into sprint generation for automatic exclusion
- Use Prisma $transaction to atomically create Release and all Sprint rows
- Keep page.tsx server-rendered with async data fetch while the form is a client component

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed sprint generation calendar contiguity**
- **Found during:** Task 1 (initial sprint generation implementation)
- **Issue:** First implementation grouped business days into chunks but did not ensure sprints were contiguous calendar ranges, which could leave gaps between sprint end and next sprint start
- **Fix:** Rewrote algorithm to partition the entire calendar range into contiguous sprints where each sprint (except last) contains exactly `defaultSprintLengthBusinessDays` business days, and the last sprint absorbs all remaining business days and extends to the release end date
- **Files modified:** `src/lib/sprint-generation.ts`
- **Verification:** Unit tests pass including absorption and holiday exclusion cases
- **Committed in:** a6f4146 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed TypeScript narrowing in validation function**
- **Found during:** Task 1 (build step)
- **Issue:** `validateReleaseInput` used an error-merge-then-check pattern that TypeScript could not narrow, causing `Property 'data' does not exist on type 'ValidationResult<string>'`
- **Fix:** Restructured to explicitly check each `ValidationResult.ok` with `||` before returning merged errors, matching the pattern in `src/lib/squad.ts`
- **Files modified:** `src/lib/releases.ts`
- **Verification:** `npm run build` passes with zero type errors
- **Committed in:** a6f4146 (Task 1 commit)

**3. [Rule 3 - Blocking] Cleared stale process on port 3000 before e2e tests**
- **Found during:** Task 3 (e2e test execution)
- **Issue:** A stale process was occupying port 3000, causing Next.js dev server to start on port 3001 instead, which made Playwright timeout waiting for `http://localhost:3000`
- **Fix:** Used PowerShell `Stop-Process` to terminate the stale process
- **Verification:** Playwright successfully started the dev server and tests passed
- **Committed in:** No file changes — environment fix

**4. [Rule 1 - Bug] Fixed e2e locator specificity**
- **Found during:** Task 3 (e2e test execution)
- **Issue:** `getByText('In progress')` matched both the `<option>` in the Status dropdown and the `<Badge>` in the table, causing a strict mode violation
- **Fix:** Scoped locators to `getByRole('table').getByText('In progress')` and used cell extraction for sprint count assertion
- **Files modified:** `tests/e2e/releases.spec.ts`
- **Verification:** Both e2e tests pass
- **Committed in:** 3fa6a77 (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (1 bug in algorithm, 2 blocking issues in build/execution, 1 bug in test locators)
**Impact on plan:** All fixes were necessary for correctness, type safety, or test execution. No scope creep.

## Issues Encountered
- Stale process on port 3000 blocked Playwright webServer startup during Task 3. Resolved by terminating the process with PowerShell.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 02-02: Active release header integration
- Ready for 02-03: Sprint list and editing screens
- Release foundation is solid with validated API, generation logic, and browser coverage

---
*Phase: 02-release-and-sprint-planning-core*
*Completed: 2026-06-03*
