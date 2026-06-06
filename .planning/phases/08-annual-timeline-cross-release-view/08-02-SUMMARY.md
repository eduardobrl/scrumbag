---
phase: 08-annual-timeline-cross-release-view
plan: 02
subsystem: ui
tags: [timeline, navigation, nextjs, next-intl, vitest]
requires:
  - phase: 08-annual-timeline-cross-release-view
    provides: annual timeline data contract
provides:
  - standalone /timeline annual page
  - cross-release comparison UI
  - yearly release swimlane grid
  - timeline navigation and localized labels
affects: [timeline, navigation, header, localization]
tech-stack:
  added: []
  patterns: [server page with pure render component, localized label prop contract]
key-files:
  created:
    - src/app/timeline/page.tsx
    - src/features/timeline/annual-timeline-view.tsx
    - src/features/timeline/year-selector.tsx
    - tests/annual-timeline-ui.test.tsx
  modified:
    - src/components/release-switcher.tsx
    - src/lib/annual-timeline.ts
    - src/lib/navigation.ts
    - src/messages/en.json
    - src/messages/pt-BR.json
key-decisions:
  - "The annual page uses a year query parameter and does not read or propagate releaseId filtering."
  - "The header release switcher becomes an annual-context label on /timeline while keeping the assistant link available."
patterns-established:
  - "Annual timeline UI receives localized labels as props so future drag-and-drop can keep the view client-friendly."
requirements-completed: [MREL-02, TL-01, TL-02]
duration: 19 min
completed: 2026-06-06
---

# Phase 08 Plan 02: Annual Timeline Page And Navigation Summary

**Standalone annual timeline page with localized navigation, cross-release metrics, and release swimlane grid**

## Performance

- **Duration:** 19 min
- **Started:** 2026-06-06T15:23:00Z
- **Completed:** 2026-06-06T15:42:00Z
- **Tasks:** 5
- **Files modified:** 10

## Accomplishments

- Added `/timeline` with year routing and default current-year behavior.
- Added sidebar Timeline navigation after Impediments and before Squad.
- Rendered cross-release comparison metrics above a twelve-month, quarter-grouped swimlane grid.
- Added active, finished, cancelled, gap, empty-release, and feature-link UI states.
- Decoupled the header release switcher from the annual page.

## Task Commits

1. **Annual timeline page and UI** - `97b0ae3` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/app/timeline/page.tsx` - Server route for the annual timeline.
- `src/features/timeline/annual-timeline-view.tsx` - Comparison and swimlane grid renderer.
- `src/features/timeline/year-selector.tsx` - Compact year controls.
- `src/components/release-switcher.tsx` - Annual context variant on `/timeline`.
- `src/lib/navigation.ts` - Timeline sidebar item.
- `src/messages/en.json` and `src/messages/pt-BR.json` - Localized annual timeline labels.
- `tests/annual-timeline-ui.test.tsx` - UI regression coverage.

## Decisions Made

- Used a standalone annual page instead of filtering by the active release selector, matching the phase constraint.
- Kept the annual view dense and horizontally scrollable with fixed month columns for desktop planning workflows.
- Corrected annual estimated-days summary to count all non-cancelled stories, including backlog stories.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Browser wrapper did not support `networkidle`; used supported `load` state for the smoke check.
- `npm run lint` and `npm run build` continue to show only pre-existing unrelated lint warnings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The annual page is ready for Plan 08-03 drag-and-drop feature reassignment on top of the existing release swimlanes.

---
*Phase: 08-annual-timeline-cross-release-view*
*Completed: 2026-06-06*
