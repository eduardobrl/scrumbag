---
phase: 08
plan: 02
type: execute
wave: 2
depends_on: [08-01-annual-timeline-data]
autonomous: true
requirements_addressed: [MREL-02, TL-01, TL-02]
files_modified:
  - src/app/timeline/page.tsx
  - src/features/timeline/annual-timeline-view.tsx
  - src/features/timeline/year-selector.tsx
  - src/components/release-switcher.tsx
  - src/lib/navigation.ts
  - src/messages/en.json
  - src/messages/pt-BR.json
  - tests/annual-timeline-ui.test.tsx
must_haves:
  truths:
    - D-01 annual timeline uses horizontal release swimlanes with one shared month and quarter axis
    - D-02 months with no releases still render as empty columns
    - D-03 features render as grid cells inside release swimlanes
    - D-04 active, finished, and cancelled features are color-coded distinctly
    - D-05 release swimlanes have equal height and are ordered by start date ascending
    - D-06 inactive feature months render as gap cells inside the feature span
    - D-07 clicking a feature cell or bar navigates to `/features/{id}`
    - D-08 cross-release comparison appears above the timeline
    - D-13 sidebar adds a Timeline item after impediments and before squad
    - D-14 `/timeline` is a standalone annual page and the header release selector does not control it
    - D-15 the page includes a year selector and defaults to the current calendar year
    - D-16 both message files include the `timeline` navigation key and page labels
    - D-17 page title, headers, month labels, and quarter labels follow PT-BR-first display
  artifacts:
    - src/app/timeline/page.tsx
    - src/features/timeline/annual-timeline-view.tsx
    - src/features/timeline/year-selector.tsx
    - tests/annual-timeline-ui.test.tsx
  key_links:
    - src/lib/annual-timeline.ts
    - src/features/dashboard/timeline-view.tsx
    - src/features/reports/report-list.tsx
    - src/components/release-switcher.tsx
    - src/lib/navigation.ts
---

# Plan 08-02: Annual Timeline Page And Navigation

<objective>
Add the `/timeline` page, sidebar entry, localized labels, year selector, cross-release comparison, and desktop-first annual swimlane grid.
</objective>

<context>
This plan depends on Plan 08-01. Keep the page read-only in this plan: feature bars can link to details, but drag-and-drop reassignment is reserved for Plan 08-03.
</context>

<task>
<name>Add navigation and localization</name>
<files>
- `src/lib/navigation.ts`
- `src/messages/en.json`
- `src/messages/pt-BR.json`
</files>
<action>
- Import the lucide `Timeline` icon or the closest available timeline icon from the installed `lucide-react` package.
- Add the `timeline` navigation item after `impediments` and before `squad`.
- Add English and Brazilian Portuguese labels for navigation, page title, year selector, release metrics, empty states, feature statuses, and timeline legend text.
- Preserve existing navigation item order outside the new insertion.
</action>
<verify>
- `npm run lint`
</verify>
<done>
- Users can reach `/timeline` from the sidebar and text renders in both locales.
</done>
</task>

<task>
<name>Build the timeline page and year routing</name>
<files>
- `src/app/timeline/page.tsx`
- `src/features/timeline/year-selector.tsx`
</files>
<action>
- Create a force-dynamic server page at `/timeline`.
- Read `year` from `searchParams`; default to the current calendar year when absent or invalid.
- Call `buildAnnualTimelineData(year)` from Plan 08-01.
- Add a compact year selector with previous/next controls and a select or numeric input for available years.
- Do not filter the annual page by `releaseId`.
</action>
<verify>
- `npm run build`
- Manual browser check on `/timeline` and `/timeline?year=2026`
</verify>
<done>
- The page loads annual data for the selected year without depending on the active release context.
</done>
</task>

<task>
<name>Render cross-release comparison and swimlane grid</name>
<files>
- `src/features/timeline/annual-timeline-view.tsx`
- `src/messages/en.json`
- `src/messages/pt-BR.json`
</files>
<action>
- Render a dense cross-release comparison table or card grid above the timeline with feature count, story count, estimated days, completion percentage, sprint count, and remaining capacity.
- Render quarter headers over monthly columns and keep all twelve month columns visible through horizontal scrolling.
- Render equal-height release swimlanes ordered by start date.
- Render feature rows using a fixed label column plus month cells, adapting the existing `TimelineView` grid pattern.
- Render active feature cells with the accent color, finished feature cells with emerald, and cancelled feature cells ghosted with strikethrough.
- Render inactive gap cells inside a feature span with a dashed or pale style.
- Wrap feature cells/bars in links to `/features/{id}`.
- Handle empty states for no releases in the year, releases without features, and cancelled-only release sets.
</action>
<verify>
- `npx vitest run tests/annual-timeline-ui.test.tsx`
- `npm run lint`
- Manual browser check on `/timeline`
</verify>
<done>
- Users can compare releases and inspect the yearly feature timeline in a stable desktop-first layout.
</done>
</task>

<task>
<name>Decouple the global release switcher on the annual page</name>
<files>
- `src/components/release-switcher.tsx`
</files>
<action>
- Detect the `/timeline` pathname in the client release switcher.
- On `/timeline`, replace the release select behavior with a non-filtering annual context label and keep the assistant link available.
- Ensure existing release-context behavior remains unchanged on dashboard, releases, backlog, sprints, reports, impediments, and assistant pages.
</action>
<verify>
- `npx vitest run tests/annual-timeline-ui.test.tsx`
- Manual browser check that changing releases elsewhere still updates `releaseId` query params.
</verify>
<done>
- The annual timeline is not accidentally filtered or controlled by the active release selector.
</done>
</task>

<task>
<name>Add UI regression tests</name>
<files>
- `tests/annual-timeline-ui.test.tsx`
</files>
<action>
- Cover rendering of quarter and month headers.
- Cover cross-release metric display for at least two releases.
- Cover feature links to detail pages.
- Cover cancelled, active, finished, gap, and empty-state styles through stable text/classes.
- Cover the `/timeline` release-switcher variant does not render the release select.
</action>
<verify>
- `npx vitest run tests/annual-timeline-ui.test.tsx`
</verify>
<done>
- Focused UI tests prove `MREL-02`, `TL-01`, and `TL-02` are visible to users.
</done>
</task>

<verification>
- `npx vitest run tests/annual-timeline-ui.test.tsx`
- `npm run lint`
- `npm run build`
- Manual browser check on `/timeline` and `/timeline?year=2026`
</verification>

<success_criteria>
- The sidebar exposes the new Timeline page in both locales.
- The annual page compares all releases in the selected year above the timeline.
- The timeline renders all twelve months, quarter grouping, release swimlanes, feature rows, status colors, gap cells, and feature detail links.
- The page remains cross-release and does not inherit active-release filtering.
</success_criteria>

