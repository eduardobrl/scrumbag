---
phase: 06-ux-polish-and-localization
plan: "01"
subsystem: ui
tags: [next-intl, localization, release-context, sprint-display, accessibility]
requires:
  - phase: 05-release-intelligence-reports-mcp-and-ai
    provides: Dashboard, reports, MCP, and assistant surfaces used by the polish pass.
provides:
  - pt-BR default locale with English fallback message files
  - Global header release switcher driven by releaseId URL params
  - Sprint calendar ranges with business-day counts
  - Shared 40px icon action button with tooltip and aria label
  - Localized primary app shell and major operational screens
affects: [dashboard, releases, features, backlog, sprints, squad, reports, assistant, settings]
tech-stack:
  added: [next-intl]
  patterns:
    - Client release context via preserved releaseId search param
    - Pure date utility for client-safe business-day display helpers
    - Shared IconButton wrapper for table actions
key-files:
  created:
    - src/components/release-switcher.tsx
    - src/components/ui/icon-button.tsx
    - src/i18n/request.ts
    - src/i18n/navigation.ts
    - src/lib/date-utils.ts
    - src/messages/pt-BR.json
    - src/messages/en.json
  modified:
    - src/app/layout.tsx
    - src/components/app-header.tsx
    - src/components/app-sidebar.tsx
    - src/features/sprints/sprint-list.tsx
    - src/features/sprints/sprint-detail.tsx
    - src/features/sprints/sprint-edit-form.tsx
    - src/features/releases/release-list.tsx
    - src/features/features/feature-list.tsx
    - src/features/stories/story-list.tsx
    - src/lib/releases.ts
    - src/lib/dashboard.ts
    - tests/backlog.test.ts
    - tests/reports.test.ts
    - tests/sprint-board.test.ts
key-decisions:
  - "Kept release switching as view context only: it updates releaseId in the URL and never changes release status."
  - "Moved weekday counting into src/lib/date-utils.ts so client components do not import Prisma-backed capacity code."
  - "Wrapped root-shell URL readers in Suspense to satisfy Next.js App Router prerendering rules."
patterns-established:
  - "Use releaseId search params for cross-page release view context."
  - "Use IconButton for table action columns that contain icon-only controls."
  - "Display sprint periods as calendar start/end plus business-day count; capacity math remains unchanged."
requirements-completed: [UX-01, UX-02, UX-03, UX-04]
duration: 90 min
completed: 2026-06-04
---

# Phase 6 Plan 01: UX Polish And Localization Summary

**pt-BR localized operational UI with global release view switching, sprint business-day labels, and accessible 40px table actions**

## Performance

- **Duration:** 90 min
- **Started:** 2026-06-04T01:54:00Z
- **Completed:** 2026-06-04T02:24:00Z
- **Tasks:** 4
- **Files modified:** 48

## Accomplishments

- Added `next-intl` scaffolding, pt-BR default messages, English fallback messages, and `<html lang="pt-BR">`.
- Added a global release switcher in the header that preserves and updates `releaseId` in the current URL.
- Updated page navigation to preserve release context across Dashboard, Releases, Features, Backlog, Sprints, Squad, Reports, Assistant, and Settings.
- Added sprint calendar range labels with inclusive business-day counts in sprint list/detail/edit, release detail, dashboard sprint table data, and timeline headers.
- Replaced compact 32px table icon buttons with a shared 40px `IconButton` component carrying `title` and `aria-label`.
- Localized major shell, page, form, table, dashboard, report, backlog, story, feature, and sprint UI text into Brazilian Portuguese.

## Task Commits

Task commits were not split because this Codex runtime executed the single Phase 6 plan inline in the main working tree.

## Files Created/Modified

- `src/components/release-switcher.tsx` - Client header dropdown that changes only the `releaseId` view context.
- `src/components/ui/icon-button.tsx` - Shared 40px icon-only action button with tooltip/accessibility label.
- `src/lib/date-utils.ts` - Client-safe weekday helpers used by display components.
- `src/messages/pt-BR.json` and `src/messages/en.json` - Translation dictionaries.
- `src/i18n/request.ts` and `src/i18n/navigation.ts` - next-intl setup.
- `src/lib/releases.ts` - Release option and selected-release helpers.
- `src/lib/dashboard.ts` - Sprint period strings now include business-day counts.
- `src/features/**` and `src/app/**` - Release context, pt-BR UI labels, sprint period display, and action button updates.
- `tests/backlog.test.ts` - Test now seeds its own squad capacity precondition.
- `tests/reports.test.ts` - Expectations aligned with configured meeting/support capacity reductions.
- `tests/sprint-board.test.ts` - Expected localized board column label updated.

## Decisions Made

- Release switching remains a view filter, not a status mutation, to preserve the one-active-release business rule.
- Weekday counting lives in a pure utility file and is re-exported from capacity for server callers; this avoids client bundles importing Prisma.
- The previous page-local Sprint release selector was removed because the global header switcher now owns that workflow.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Avoided Prisma imports in client components**
- **Found during:** Task 1
- **Issue:** The planned helper location, `src/lib/capacity.ts`, imports Prisma-backed modules, which would leak server-only code into client components.
- **Fix:** Created `src/lib/date-utils.ts` and re-exported `countBusinessDaysInRange` from `capacity.ts`.
- **Files modified:** `src/lib/date-utils.ts`, `src/lib/capacity.ts`, sprint/dashboard client components.
- **Verification:** `npm run build` passed.

**2. [Rule 3 - Blocking] Added Suspense around root-shell search-param readers**
- **Found during:** Task 2
- **Issue:** Next.js build failed because `useSearchParams()` in root shell client components affected the prerendered 404 route.
- **Fix:** Wrapped `AppSidebar` and `AppHeader` in Suspense fallbacks in `AppShell`.
- **Files modified:** `src/components/app-shell.tsx`.
- **Verification:** `npm run build` passed.

**3. [Rule 3 - Blocking] Stabilized tests with explicit capacity fixtures**
- **Found during:** Verification
- **Issue:** Backlog and report tests depended on ambient capacity setup or outdated capacity expectations.
- **Fix:** Backlog test now seeds its own squad member; reports test expectations match meeting/support capacity reductions; sprint board test expects the localized title.
- **Files modified:** `tests/backlog.test.ts`, `tests/reports.test.ts`, `tests/sprint-board.test.ts`.
- **Verification:** `npm.cmd test` passed: 90 tests.

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All deviations were required for correct build behavior, deterministic tests, and safe client/server boundaries. No product scope was expanded.

## Issues Encountered

- PowerShell blocked the `npm.ps1` shim; using `npm.cmd` resolved install/build/test execution on Windows.
- Browser smoke testing found remaining English text on the Releases form; the visible form/filter/report/detail strings were localized before close-out.

## Verification

- `npm.cmd run build` - passed.
- `npm.cmd test` - passed, 16 test files and 90 tests.
- In-app browser smoke at `http://localhost:3000/releases` - shell, header, navigation, and release form rendered in Portuguese; route navigation worked.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 6 covers the final v1 polish requirements. The app is ready for milestone completion/audit.

---
*Phase: 06-ux-polish-and-localization*
*Completed: 2026-06-04*
