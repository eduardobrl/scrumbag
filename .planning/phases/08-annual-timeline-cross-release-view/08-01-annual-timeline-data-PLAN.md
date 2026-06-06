---
phase: 08
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements_addressed: [MREL-02, TL-01, TL-02]
files_modified:
  - src/lib/annual-timeline.ts
  - tests/annual-timeline.test.ts
must_haves:
  truths:
    - D-01 annual timeline uses horizontal release swimlanes with one shared month and quarter axis
    - D-02 all twelve monthly columns render for the selected year, grouped under Q1-Q4, even when no releases exist in a month
    - D-03 features render as grid rows inside release swimlanes with a label column and month cells
    - D-04 active, finished, and cancelled features are all included; finished is derived from story completion, cancelled from feature lifecycle status
    - D-05 release swimlanes are equal height and ordered by start date ascending
    - D-06 feature bars span first-to-last active month and expose inactive gap months
    - D-08 cross-release comparison exposes feature count, story count, estimated days, completion percentage, sprint count, and remaining capacity
    - D-15 the selected year defaults to the current calendar year in the page layer
    - D-17 month and quarter labels are compatible with the existing PT-BR-first UI convention
  artifacts:
    - src/lib/annual-timeline.ts
    - tests/annual-timeline.test.ts
  key_links:
    - src/lib/timeline.ts
    - src/lib/releases.ts
    - src/lib/features.ts
    - src/lib/dashboard.ts
    - src/lib/date-utils.ts
---

# Plan 08-01: Annual Timeline Data And Cross-Release Metrics

<objective>
Add a reusable annual timeline data layer that returns year months, release swimlanes, feature month spans, inactive gaps, and cross-release comparison metrics.
</objective>

<context>
This plan creates the data contract for `MREL-02`, `TL-01`, and `TL-02`. Do not build the page, navigation, drag-and-drop, or reassignment API here.
</context>

<task>
<name>Define annual timeline types and year helpers</name>
<files>
- `src/lib/annual-timeline.ts`
</files>
<action>
- Add types for `AnnualTimelineMonth`, `AnnualTimelineQuarter`, `AnnualReleaseSummary`, `AnnualTimelineFeature`, `AnnualTimelineRelease`, and `AnnualTimelineData`.
- Add a helper that builds all twelve month columns for the selected year with quarter grouping metadata.
- Add date helpers that determine whether a release overlaps the selected year and map sprint/story activity dates to month indexes.
- Keep date formatting stable as `YYYY-MM-DD` for machine-friendly tests and UI formatting later.
</action>
<verify>
- `npx vitest run tests/annual-timeline.test.ts`
</verify>
<done>
- The data module can describe a full annual grid even when some months have no releases.
</done>
</task>

<task>
<name>Build cross-release summaries</name>
<files>
- `src/lib/annual-timeline.ts`
- `src/lib/dashboard.ts`
</files>
<action>
- Query releases whose date range overlaps the selected year and order them by `startDate` ascending.
- For each release, compute feature count, non-cancelled story count, total estimated days, completion percentage, sprint count, total capacity days, planned effort days, and remaining capacity days.
- Reuse existing dashboard, capacity, and feature summary helpers where practical instead of duplicating formulas.
- Include planned, in-progress, closed, and cancelled releases in the annual view; status is data for the UI, not a filter.
</action>
<verify>
- `npx vitest run tests/annual-timeline.test.ts`
</verify>
<done>
- `MREL-02` has a data source that can compare all releases side by side for the selected year.
</done>
</task>

<task>
<name>Build release swimlanes and feature month spans</name>
<files>
- `src/lib/annual-timeline.ts`
- `src/lib/features.ts`
</files>
<action>
- Load every feature for each release, including active and cancelled features.
- Derive display status as `ACTIVE`, `FINISHED`, or `CANCELLED`; use `FeatureLifecycleStatus.CANCELLED` for cancelled and story completion for finished.
- For each feature, derive active month indexes from non-cancelled stories assigned to sprints.
- Compute `startIndex`, `endIndex`, `activeMonthIndexes`, and `inactiveGaps` using the same gap idea as `src/lib/timeline.ts`.
- Keep unplanned features visible with null span indexes and summary counts.
</action>
<verify>
- `npx vitest run tests/annual-timeline.test.ts`
</verify>
<done>
- `TL-01` and `TL-02` can render releases across months and features grouped under their target release.
</done>
</task>

<task>
<name>Add annual timeline data tests</name>
<files>
- `tests/annual-timeline.test.ts`
</files>
<action>
- Cover generation of all twelve months and Q1-Q4 groupings.
- Cover release filtering by selected year with date ordering.
- Cover cross-release summary metrics for multiple releases.
- Cover feature span and inactive gap calculation across month columns.
- Cover active, finished, cancelled, and unplanned feature rows.
</action>
<verify>
- `npx vitest run tests/annual-timeline.test.ts`
</verify>
<done>
- Focused tests prove the annual timeline data contract before UI and drag-and-drop work depends on it.
</done>
</task>

<verification>
- `npx vitest run tests/annual-timeline.test.ts`
- `npm run lint`
</verification>

<success_criteria>
- `MREL-02` is covered at the data level by cross-release comparison metrics.
- `TL-01` is covered at the data level by a full yearly month/quarter grid and release swimlanes.
- `TL-02` is covered at the data level by feature rows grouped under their release with spans and gaps.
- Multiple-active-release behavior remains deferred; the one-active-release status constraint is not changed.
</success_criteria>

