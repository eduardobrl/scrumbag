# Phase 8: Annual Timeline & Cross-Release View - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 8-annual-timeline-cross-release-view
**Areas discussed:** Timeline Layout, Feature Reassignment UX & Rules, Navigation Entry Point

---

## Timeline Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical stack with shared timeline | One release row per horizontal band with feature bars spanning sprint/month columns below — extends existing CSS-grid pattern | |
| Independent per-release sections | Each release gets its own full-width timeline section stacked vertically | |
| Swimlane / Gantt-style | Horizontal month/quarter axis across the top, each release as a swimlane row with feature bars within each swimlane | ✓ |

**User's choice:** Swimlane / Gantt-style
**Notes:** Releases as horizontal rows with a shared time axis across the top. This is a departure from the per-release single-timeline pattern.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Compact feature bars within swimlanes | Horizontal bar per feature showing start-to-end span | |
| Grid cells per time unit | Feature name in left label column, sprint/month cells to the right — same as existing pattern | ✓ |
| Block with label | Color-coded rectangle proportional to duration | |

**User's choice:** Grid cells per time unit
**Notes:** Same pattern as the existing per-release `TimelineView` — label column + cell columns.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Months grouped by quarters | Monthly columns with Q1-Q4 grouping headers above | ✓ |
| Sprint-level columns | Sprint-level columns — matches existing but creates many columns | |
| Weeks | Weekly columns — finer granularity but very wide | |

**User's choice:** Months grouped by quarters
**Notes:** Quarter headers (Q1, Q2, Q3, Q4) group the month columns underneath.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Active features only | Only active features shown | |
| All features with status distinction | Active + cancelled with different styling | |
| All features color-coded | Active, finished, and cancelled all shown with distinct colors | ✓ |

**User's choice:** All features color-coded
**Notes:** All features appear. Color coding distinguishes active (accent), finished (emerald), and cancelled (ghosted).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Equal height, date-ordered | Releases ordered by start date, equal height | ✓ |
| Proportional to feature count | Busier releases get more vertical space | |
| Status-first, then date | IN_PROGRESS first, then PLANNED, then CLOSED | |

**User's choice:** Equal height, date-ordered
**Notes:** Swimlanes have uniform height. Ordered by release startDate ascending.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Span with gap indicators | Feature bars span first-to-last month with gap cells — same as existing | ✓ |
| Continuous bar | Single continuous bar regardless of gaps | |
| Only active months shown | Only months with stories show colored cells | |

**User's choice:** Span with gap indicators
**Notes:** Consistent with existing per-release timeline pattern — unfilled/inactive cells show gaps.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Click to feature detail | Click navigates to `/features/{id}` | ✓ |
| Read-only visual | Feature bars are purely visual | |
| Inline popover on click | Opens popover with feature summary without leaving timeline | |

**User's choice:** Click to feature detail
**Notes:** Feature cells are clickable links to the feature detail page.

---

## Feature Reassignment UX & Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Drag feature bar between swimlanes | Drag from one release row to another — visual preview follows cursor | ✓ |
| Dropdown target selection | Click to open dropdown for target release | |
| Drag handle with click-to-detail | Separate grab handle for drag, rest of row clickable for detail | |

**User's choice:** Drag feature bar between swimlanes
**Notes:** Full dnd-kit drag — feature cells are draggable, release swimlanes are droppable. Requires `@dnd-kit/core` installation.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stories detached, move to backlog | Stories move but detached from sprint (BACKLOG) | ✓ |
| Feature only, stories stay | Feature moves alone | |
| Smart remap to target sprints | Map to equivalent sprint positions in target release | |
| Move with confirmation preview | Interactive preview of consequences before committing | |

**User's choice:** Stories detached, move to backlog
**Notes:** `currentSprintId = null`, `status → BACKLOG`. User re-plans stories into target release later.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate with undo toast | Drop commits immediately; undo button in toast | ✓ |
| Confirmation modal before commit | Modal appears after drop requiring explicit confirmation | |
| Immediate, no undo | No safety net — fastest UX | |

**User's choice:** Immediate with undo toast
**Notes:** API call fires on drop. Toast shows "Feature moved to {release name}" with an undo button.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Entire swimlane is drop target | Any part of the release row accepts drops | ✓ |
| Drop zone in release header | Only a specific zone at the top of each swimlane accepts | |
| Button-triggered only | No free-form drag | |

**User's choice:** Entire swimlane is drop target
**Notes:** The full release swimlane highlights when a feature is dragged over it.

---

## Navigation Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| New sidebar nav: Timeline | Dedicated nav item in sidebar | ✓ |
| Tab within dashboard page | Tab/section within existing dashboard | |
| Within reports page | Part of `/reports` | |
| Within releases page | Button/tab on `/releases` | |

**User's choice:** New sidebar nav: Timeline
**Notes:** New `timeline` entry in `navigationItems`. Position: after impediments, before squad.

---

| Option | Description | Selected |
|--------|-------------|----------|
| No release selector | No release context — cross-release by nature | ✓ |
| Optional release selector | Selector present but optional | |
| Selector with filter mode | Defaults to current release, filters view | |

**User's choice:** No release selector
**Notes:** Annual timeline page is inherently cross-release. The header release context selector does not affect this page.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Year selector | Navigate between years, default to current year | ✓ |
| Auto-detect, show all years | Show all releases across all years at once | |
| Current year only | Always current year, no selector | |

**User's choice:** Year selector
**Notes:** Dropdown or arrow controls to switch year. Defaults to current calendar year.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Timeline icon (lucide-react) | `Timeline` icon from lucide-react | ✓ |
| CalendarRange (same as Releases) | Same icon as Releases page | |
| Different icon | Clock, History, or similar | |

**User's choice:** Timeline icon (lucide-react)
**Notes:** Use the `Timeline` icon (or closest available in lucide-react) to distinguish from the Releases page.

---

## the agent's Discretion

- Feature status color coding scheme (active, finished, cancelled)
- Cross-release comparison layout (table vs cards)
- Toast notification implementation approach
- Empty state designs (no releases, no features, all cancelled)
- Month/quarter grid header styling

## Deferred Ideas

- **TL-04 (Timeline filters by year, quarter, feature status):** Future milestone
- **IMP-04/05 (Dashboard alerts, CSV export for impediments):** Future milestone
- **MREL-01 (Multiple active releases):** Deferred 2026-06-06
