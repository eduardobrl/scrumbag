---
phase: 07
plan: 03
type: execute
wave: 3
depends_on: [07-01-impediment-data-api, 07-02-impediment-ui]
autonomous: true
requirements_addressed: [IMP-02, IMP-03]
files_modified:
  - src/lib/timeline.ts
  - src/features/dashboard/timeline-view.tsx
  - src/app/api/timeline/route.ts
  - src/messages/en.json
  - src/messages/pt-BR.json
  - tests/timeline-impediments.test.ts
must_haves:
  truths:
    - D-06 impediments appear as a separate row section below feature rows on the existing release timeline
    - D-07 impediments use a colored horizontal span bar across affected sprint columns and distinct from feature, sprint, and leakage colors
    - D-08 resolved impediments display a check mark on their timeline bar
    - D-09 timeline bars use hover tooltip only, with no click navigation
    - D-14 blocked duration uses business days
    - D-15 delivery impact includes story count, summed estimated days, and blocked business days
    - D-16 timeline tooltip shows compact delivery impact
    - D-17 unresolved impediments show running blocked days, story count, and estimated days
  artifacts:
    - src/lib/timeline.ts
    - src/features/dashboard/timeline-view.tsx
    - tests/timeline-impediments.test.ts
  key_links:
    - src/lib/date-utils.ts
    - src/features/dashboard/timeline-view.tsx
    - src/app/page.tsx
---

# Plan 07-03: Timeline Markers And Delivery Impact Integration

<objective>
Extend the release timeline with impediment spans and compact impact signals so users can see when blockers occurred, which stories they affected, and whether they were resolved.
</objective>

<context>
This plan completes Phase 7 by integrating the impediment model into the existing dashboard timeline. Keep feature rows, sprint headers, leakage markers, and horizontal scrolling intact.
</context>

<task>
<name>Extend timeline data with impediment spans</name>
<files>
- `src/lib/timeline.ts`
- `src/lib/impediments.ts`
</files>
<action>
- Add a `TimelineImpediment` type and an `impediments` array to `TimelineData`.
- Query impediments whose affected stories belong to the requested release.
- Derive affected sprint IDs from linked stories' current sprint assignments.
- Convert affected sprint IDs to `startIndex` and `endIndex`.
- Include status, reported date, resolution date, affected story count, estimated days, blocked business days, and compact impact text.
- Keep impediments without sprint-assigned stories visible in returned data with null span indexes.
</action>
<verify>
- `npx vitest run tests/timeline-impediments.test.ts`
</verify>
<done>
- `buildTimelineData()` returns existing data unchanged plus impediment data derived from story relations.
</done>
</task>

<task>
<name>Render impediment rows in the timeline component</name>
<files>
- `src/features/dashboard/timeline-view.tsx`
- `src/messages/en.json`
- `src/messages/pt-BR.json`
</files>
<action>
- Add a legend entry for impediment bars and resolved state.
- Render an "Impediments" section below feature rows.
- Render each impediment as a non-clickable horizontal bar spanning affected sprint columns.
- Use a color distinct from feature teal, sprint green, and leakage amber.
- Add hover tooltip text with title, dates, affected story count, estimated days, and blocked business days.
- Show a check mark on resolved bars.
- Preserve stable grid dimensions and horizontal scrolling.
</action>
<verify>
- `npx vitest run tests/timeline-impediments.test.ts`
- `npm run lint`
- Manual browser check on the dashboard timeline.
</verify>
<done>
- User can view open and resolved impediment markers on the release timeline without broken feature rows.
</done>
</task>

<task>
<name>Keep timeline API consumers compatible</name>
<files>
- `src/app/api/timeline/route.ts`
- `src/lib/timeline.ts`
</files>
<action>
- Ensure the timeline API returns the new `impediments` field.
- Confirm existing consumers compile with the extended `TimelineData` type.
- Avoid removing or renaming existing `sprints`, `features`, and `leakedSprints` fields.
</action>
<verify>
- `npm run build`
</verify>
<done>
- Dashboard and API timeline consumers continue to work with the new field.
</done>
</task>

<task>
<name>Add timeline integration tests</name>
<files>
- `tests/timeline-impediments.test.ts`
</files>
<action>
- Cover impediment span index calculation from affected story sprint assignments.
- Cover resolved status data and blocked duration.
- Cover unresolved running blocked duration.
- Cover a mixed timeline where features remain present alongside impediments.
</action>
<verify>
- `npx vitest run tests/timeline-impediments.test.ts`
</verify>
<done>
- Tests cover `IMP-02` and the timeline portion of `IMP-03`.
</done>
</task>

<verification>
- `npx vitest run tests/timeline-impediments.test.ts`
- `npm run lint`
- `npm run build`
- Manual browser check on the dashboard timeline with open and resolved impediments.
</verification>

<success_criteria>
- `IMP-02` is covered by visible impediment markers in the release timeline.
- `IMP-03` is reinforced by resolved markers, blocked business days, and compact delivery impact in the tooltip.
- The existing timeline remains usable and stable with feature rows, leakage markers, sprint headers, and the new impediment section.
</success_criteria>

