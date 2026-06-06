# Phase 8: Annual Timeline & Cross-Release View - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

## Phase Boundary

Users view all releases on a yearly timeline with features mapped per release, compare releases side by side via cross-release metrics, and reassign features between releases via drag-and-drop on the annual timeline.

## Implementation Decisions

### Timeline Layout
- **D-01:** Swimlane/Gantt-style layout — horizontal release swimlanes with a shared month/quarter header axis
- **D-02:** Time unit: monthly columns grouped under quarter headers (Q1-Q4). Months with no releases still render as empty columns to maintain the calendar grid
- **D-03:** Features rendered as grid cells within each release swimlane (label column on left, month cells to the right) — same pattern as the existing per-release timeline
- **D-04:** All features shown — active (solid bar), finished (emerald), and cancelled (ghosted/strikethrough) — color-coded by lifecycle status
- **D-05:** Release swimlanes have equal height and are ordered by start date ascending
- **D-06:** Feature bars span the first-to-last month where the feature has stories, with unfilled/inactive gap cells for months without story activity — consistent with existing per-release timeline gap pattern
- **D-07:** Click on a feature cell/bar navigates to the feature detail page (`/features/{id}`)

### Cross-Release Comparison
- **D-08:** A side-by-side metrics table or card grid above the timeline comparing all releases on key metrics (feature count, story count, total estimated days, completion %, sprint count, remaining capacity) — fulfills MREL-02 and success criterion 1

### Feature Reassignment
- **D-09:** Drag feature bar from one release swimlane and drop into another using dnd-kit (`@dnd-kit/core` — must be installed; not yet in node_modules)
- **D-10:** Entire release swimlane acts as a valid drop target — dragging a feature over any part of the target release swimlane highlights it
- **D-11:** Drop is immediate (no confirmation modal). The feature's `releaseId` updates in one API call. A toast notification appears with an undo button that reverses the reassignment
- **D-12:** All stories move with the feature to the target release. Stories are detached from their current sprint (`currentSprintId = null`, `status → BACKLOG`) — the user replans them into target release sprints later

### Navigation & Page Structure
- **D-13:** New "Timeline" sidebar nav item with `Timeline` icon from lucide-react (after impediments, before squad)
- **D-14:** Standalone page at `/timeline` — no release context selector in the header (the annual view is inherently cross-release)
- **D-15:** Year selector component at the top of the page to navigate between years, defaulting to the current calendar year
- **D-16:** i18n: new nav label key `timeline` in both `src/messages/en.json` and `src/messages/pt-BR.json`
- **D-17:** Page title, headers, and month/quarter labels follow existing PT-BR-first convention

### the agent's Discretion
- **Feature status color coding:** Pick a distinct color scheme for active (reuse accent/accent), finished (emerald), and cancelled (ghosted gray with strikethrough) feature cells
- **Cross-release comparison layout:** Choose between table grid or summary cards — whichever best fits the screen above the timeline
- **Toast notification design:** Implement undo pattern using existing UI primitives (no new library)
- **Empty states:** No releases in the selected year, no features in a release, or all releases cancelled — handle each cleanly

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & Screen Specs
- `spec.md` — Original product specification covering sprint planning concepts and timeline feature definitions
- `telas.md` — Screen specifications and UI mockups with timeline layout references

### Project-Level
- `.planning/PROJECT.md` — Stack, constraints, capacity model, key decisions, one-active-release constraint
- `.planning/REQUIREMENTS.md` — MREL-02, TL-01, TL-02, TL-03 requirements and traceability
- `.planning/ROADMAP.md` — Phase 8 success criteria and scope boundary
- `.planning/STATE.md` — v1.1 decisions (one-active-release, per-release impediment scope)

### Prior Phase Context
- `.planning/phases/07-impediment-tracking/07-CONTEXT.md` — Phase 7 decisions (impediment data model, timeline integration patterns, UI patterns)

### Existing Code
- `src/lib/timeline.ts` — `buildTimelineData()` and `TimelineData` types (per-release timeline — reference pattern)
- `src/features/dashboard/timeline-view.tsx` — `TimelineView` component, CSS-grid pattern with sprint columns and feature rows (visual reference to adapt)
- `src/lib/releases.ts` — `listReleases()`, `listReleaseOptions()`, `toReleaseView()` (release data for annual view)
- `src/lib/features.ts` — `listFeatures()`, `toFeatureView()`, `calculateFeatureSummary()` (feature data and summary calc)
- `src/lib/navigation.ts` — Navigation items array (add timeline entry)
- `src/app/page.tsx` — Dashboard page pattern (server component + data fetching + client feature components)
- `src/app/reports/page.tsx` — Cross-release page pattern (references all releases, no single release context)
- `prisma/schema.prisma` — Current data model (Release, Feature, Story, Sprint, Impediment)
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/date-utils.ts` — `countBusinessDaysInRange()` (reuse for month-to-month calculations)
- `src/messages/en.json` / `src/messages/pt-BR.json` — i18n message files (add timeline keys)
- `package.json` — dnd-kit listed in PROJECT.md stack but NOT installed (must add `@dnd-kit/core`)

### Design Patterns Reference
- `src/components/ui/card.tsx` — Card component used throughout
- `src/components/ui/button.tsx` — Button component
- `src/features/reports/report-list.tsx` — Cross-release UI pattern (list of releases + release selector)

## Existing Code Insights

### Reusable Assets
- **`TimelineView` component** (`src/features/dashboard/timeline-view.tsx`): CSS-grid pattern with label column + time-unit cells — the annual timeline adapts this to release swimlanes with month columns instead of sprint columns
- **`buildTimelineData()`** (`src/lib/timeline.ts`): Per-release data aggregation pattern — extend or create a new `buildAnnualTimelineData()` function that returns release swimlanes with features mapped to months
- **`listReleases()`** (`src/lib/releases.ts`): Already returns all releases with sprints — direct data source for the annual view
- **`listFeatures()`** (`src/lib/features.ts`): Returns all features with stories, sprints, and release — can pull features per release for swimlane mapping
- **`calculateFeatureSummary()`** (`src/lib/features.ts`): Feature completion %, story count, estimated days — reusable for cross-release comparison
- **`Card`, `Badge`, `Button`, `Input`** components: Reusable UI primitives
- **`countBusinessDaysInRange()`** (`src/lib/date-utils.ts`): Business day calculation for month columns
- **`ReportList`** (`src/features/reports/report-list.tsx`): Cross-release data loading pattern (fetches all releases, not tied to `releaseId` search params)

### Established Patterns
- **Page pattern**: Server component fetches data via lib functions, passes to client feature components
- **Timeline pattern**: CSS-grid with label column + time-unit cells, horizontal scroll overflow
- **Form pattern**: "use client", useState per field, fetch API POST/PATCH, useTransition for navigation
- **API route pattern**: Next.js route handlers, prisma import, standard CRUD
- **i18n pattern**: next-intl with messages in `src/messages/{en,pt-BR}.json`, `useTranslations()` in client components
- **Navigation pattern**: `navigationItems` array in `src/lib/navigation.ts`, lucide-react icons

### Integration Points
- **Navigation**: New `timeline` entry in `navigationItems` array (after `impediments`, before `squad`) and in both message files
- **Timeline page**: New `src/app/timeline/page.tsx` — server component that fetches all releases + features, passes to client timeline component
- **Feature reassignment API**: New route or extend existing feature update route to handle `releaseId` change with story detachment logic
- **dnd-kit**: Install `@dnd-kit/core` (and likely `@dnd-kit/utilities`) — first usage of dnd-kit in this codebase
- **Feature detail page**: Already exists at `src/app/features/[id]/page.tsx` — feature bar clicks link here
- **Release selector exclusion**: Annual timeline page does not pass `releaseId` search param

## Specific Ideas

No specific references or examples mentioned — open to standard Gantt/swimlane patterns following the existing CSS-grid timeline approach.

## Deferred Ideas

- **TL-04 (Timeline filters by year, quarter, or feature status):** Deferred to future milestone (per REQUIREMENTS.md)
- **IMP-04 (Dashboard alerts for unresolved impediments):** Deferred to future milestone (per REQUIREMENTS.md)
- **IMP-05 (CSV/Excel impediment export):** Deferred to future milestone (per REQUIREMENTS.md)
- **MREL-01 (Multiple active releases simultaneously):** Deferred 2026-06-06 per user decision — one-active-release constraint remains

---

*Phase: 8-Annual Timeline & Cross-Release View*
*Context gathered: 2026-06-06*
