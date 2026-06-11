# Phase 10: Estimate Audit History & Drift Summary - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

## Phase Boundary

After Phase 9's PLANNING state and baseline capture, this phase adds the audit trail for post-go-live estimate changes and a release-level drift summary comparing baseline vs. current estimates.

## Implementation Decisions

### Audit Record Storage
- **D-01:** Per-field granularity — one audit row per changed field (e.g., updating both points 5→8 and days 3→5 creates two rows). Matches AUD-02's "field changed" wording and keeps querying straightforward.
- **D-02:** EstimateChange model includes an optional `changeReason` text field for free-text notes explaining why the estimate changed. No `changedBy` field needed (single-user app).
- **D-03:** Audit only `storyPoints` and `estimatedDays` — not title, description, or other story fields. Keeps the audit table focused on drift-relevant changes.
- **D-04:** Null values recorded explicitly — `oldValue=null, newValue=5` and `oldValue=8, newValue=null` are valid audit rows. Null→null changes (no actual change) are not recorded.

### History Display in Story Panel
- **D-05:** Estimate change history rendered as a collapsible section below the StoryForm on the story edit page (`src/app/stories/[id]/edit/page.tsx`). Only visible when history records exist AND the release is IN_PROGRESS+.
- **D-06:** Chronological list format with delta cards — each entry shows what changed (e.g., "Story Points changed from 5 to 8") with date and optional reason. Color-coded: green + ↓ for decreases, amber + ↑ for increases up to 20%, red + ↑ for increases over 20%.
- **D-07:** Section is entirely hidden when no history records exist (no empty state placeholder).

### Drift Summary Placement & Visuals
- **D-08:** Dedicated "Estimate Drift" section on the release detail page (`src/features/releases/release-detail.tsx`), positioned between the stat cards and the sprint table.
- **D-09:** Side-by-side comparison layout — Baseline column (total points, total days) vs. Current column (total points, total days) with the delta highlighted. Color-coded arrow badges on deltas (same color scheme as story history).
- **D-10:** Drift section only appears when a baseline exists (release is IN_PROGRESS or CLOSED with baseline captured). Not shown for PLANNING/PLANNED releases.

### Drift Scope & Calculation
- **D-11:** Include all baselined stories in the drift comparison, even if they were later cancelled — shows the full picture including scope removal.
- **D-12:** Exclude stories created after go-live that weren't in the baseline. They represent new scope and would conflate drift with scope growth.
- **D-13:** Show story-level context metadata below the side-by-side totals: "Compared N stories (M with changes, K cancelled since baseline, J added since baseline)".

### the agent's Discretion
- Where exactly to place the `changeReason` input in the story form (could be a separate field on the edit page or inline with the estimate inputs) — downstream agents should choose the cleanest UX.
- The exact threshold values for color coding (20% for red) can be tuned by the implementer.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — AUD-01, AUD-02, AUD-03, DRF-01: the four requirements this phase fulfills
- `.planning/PROJECT.md` §Active — v1.2 active requirements and constraints

### Phase 9 Dependencies
- `src/lib/release-estimates.ts` — `captureReleaseEstimateBaseline()` and `ReleaseEstimateBaseline` model — baseline capture is already implemented
- `src/lib/release-status.ts` — `isAllowedReleaseTransition()` — status transition enforcement (PLANNING→IN_PROGRESS triggers baseline capture at `src/lib/releases.ts:317-319`)
- `prisma/schema.prisma` — `ReleaseEstimateBaseline`, `ReleaseEstimateBaselineItem` models (lines 99-119) — baseline schema already exists

### Codebase Patterns
- `src/features/stories/story-form.tsx` — StoryForm component, already passes `releaseStatus` prop for conditional UI
- `src/features/stories/story-list.tsx` — table patterns and Badge usage
- `src/features/releases/release-detail.tsx` — ReleaseDetail component, stat card layout, sprint table — drift section inserts here
- `src/lib/stories.ts` — `updateStory()` function — this is where audit recording logic must be added

## Existing Code Insights

### Reusable Assets
- `Badge` component (`src/components/ui/badge.tsx`) — already supports `tone` prop (neutral/success/warning/danger) — reuse for color-coded delta badges
- `Card` component (`src/components/ui/card.tsx`) — used for stat cards and content sections — reuse for drift summary cards and history list entries
- `IconButton` component (`src/components/ui/icon-button.tsx`) — pattern for buttons in table rows

### Established Patterns
- Stat card grid layout in release detail (grid with sm:grid-cols-2 lg:grid-cols-4)
- Table with `overflow-hidden rounded-lg border border-line` as container, `bg-slate-50` header rows
- Collapsible sections use conditional rendering based on existence of data
- Server-side data fetching in page components, client-side interactivity in feature components

### Integration Points
- `src/lib/stories.ts:updateStory()` — insert audit record creation here when release status is IN_PROGRESS+ and estimates changed
- `src/app/stories/[id]/edit/page.tsx` — add history data fetch and pass to StoryForm or a sibling component
- `src/app/releases/[id]/page.tsx` — add drift data fetch and pass to ReleaseDetail
- `src/features/releases/release-detail.tsx` — add drift section between stat cards and sprint table
- `prisma/schema.prisma` — add `EstimateChange` model with fields: id, storyId, field (storyPoints/estimatedDays), oldValue (Float?), newValue (Float?), changeReason (String?), timestamp (DateTime)

## Specific Ideas

- The chronological history list should feel like an audit log — each entry a card with the field name, old→new values, timestamp, and reason (if provided)
- Color coding should be subtle — use the existing Badge tone system rather than garish colors
- Drift summary should be scannable in ~3 seconds — the big numbers (baseline, current, delta) should stand out

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 10-Estimate Audit History & Drift Summary*
*Context gathered: 2026-06-11*
