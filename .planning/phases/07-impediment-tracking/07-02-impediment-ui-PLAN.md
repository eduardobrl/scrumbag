---
phase: 07
plan: 02
type: execute
wave: 2
depends_on: [07-01-impediment-data-api]
autonomous: true
requirements_addressed: [IMP-01, IMP-03]
files_modified:
  - src/app/impediments/page.tsx
  - src/app/impediments/[id]/page.tsx
  - src/features/impediments/impediment-form.tsx
  - src/features/impediments/impediment-list.tsx
  - src/features/impediments/impediment-detail.tsx
  - src/features/impediments/resolve-impediment-form.tsx
  - src/lib/navigation.ts
  - src/messages/en.json
  - src/messages/pt-BR.json
  - tests/impediments-ui.test.tsx
must_haves:
  truths:
    - D-01 stories are selected via a multi-select list from all stories in the current release
    - D-02 affected stories are mandatory
    - D-04 affected stories appear as a title-only linked list in detail view
    - D-05 impediment pages respect current release context
    - D-10 UI shows OPEN and RESOLVED states
    - D-11 resolution captures required date and optional notes
    - D-12 resolved impediments cannot be reopened
    - D-15 delivery impact includes story count, summed estimated days, and blocked business days
    - D-16 full delivery impact appears on the impediment detail page
    - D-17 unresolved impediments show running blocked days, story count, and estimated days
  artifacts:
    - src/app/impediments/page.tsx
    - src/app/impediments/[id]/page.tsx
    - src/features/impediments/impediment-form.tsx
    - src/features/impediments/impediment-detail.tsx
    - tests/impediments-ui.test.tsx
  key_links:
    - src/features/stories/story-form.tsx
    - src/lib/navigation.ts
    - src/messages/pt-BR.json
    - src/messages/en.json
---

# Plan 07-02: Impediment Operational UI

<objective>
Add desktop-first screens for creating, browsing, inspecting, and resolving impediments with localized labels and clear delivery impact.
</objective>

<context>
This plan depends on Plan 07-01. Keep the UI operational and dense: forms, list/table, badges, summary cards, and linked affected stories. Do not add dashboard alerts or exports.
</context>

<task>
<name>Add navigation and localization for impediments</name>
<files>
- `src/lib/navigation.ts`
- `src/messages/en.json`
- `src/messages/pt-BR.json`
</files>
<action>
- Add a sidebar item for impediments with an appropriate lucide icon.
- Add English and Brazilian Portuguese keys for navigation, list, form, detail, resolution, status, validation, and impact labels.
- Preserve release context passthrough behavior in the app shell.
</action>
<verify>
- `npm run lint`
</verify>
<done>
- Users can reach `/impediments` from navigation and labels render in both locales.
</done>
</task>

<task>
<name>Build impediment list and creation workflow</name>
<files>
- `src/app/impediments/page.tsx`
- `src/features/impediments/impediment-form.tsx`
- `src/features/impediments/impediment-list.tsx`
</files>
<action>
- Resolve the active or selected release using existing release-context patterns.
- Load non-cancelled stories for the selected release and label them by feature for scanning.
- Build a create form with title, description, reported date, and affected story multi-select.
- Show API field errors inline.
- Show empty states for no release and no available stories.
- Show existing impediments with status, reported date, story count, estimated days, and blocked business days.
</action>
<verify>
- `npx vitest run tests/impediments-ui.test.tsx`
- `npm run lint`
</verify>
<done>
- User can create an impediment with title, description, date, and one or more current-release stories.
- Submitting without affected stories displays a validation error.
</done>
</task>

<task>
<name>Build detail and resolution workflow</name>
<files>
- `src/app/impediments/[id]/page.tsx`
- `src/features/impediments/impediment-detail.tsx`
- `src/features/impediments/resolve-impediment-form.tsx`
</files>
<action>
- Render title, status, description, reported date, resolution date, resolution notes, and impact summary cards.
- Render affected stories as title-only linked rows.
- Add a resolution form for open impediments with required resolution date and optional notes.
- Hide resolution actions for resolved impediments and do not add reopen behavior.
- Refresh after successful resolution.
</action>
<verify>
- `npx vitest run tests/impediments-ui.test.tsx`
- Manual browser check on `/impediments` and `/impediments/{id}` with local seeded data.
</verify>
<done>
- User can resolve an open impediment exactly once.
- Detail view shows final or running blocked days plus story count and estimated days.
</done>
</task>

<task>
<name>Add UI regression tests</name>
<files>
- `tests/impediments-ui.test.tsx`
</files>
<action>
- Cover create form rendering with story options.
- Cover validation display when affected stories are omitted.
- Cover detail impact summary for open and resolved impediments.
- Cover absence of reopen action for resolved impediments.
</action>
<verify>
- `npx vitest run tests/impediments-ui.test.tsx`
</verify>
<done>
- Focused UI tests prove `IMP-01` registration and `IMP-03` resolution flows.
</done>
</task>

<verification>
- `npx vitest run tests/impediments-ui.test.tsx`
- `npm run lint`
- Manual browser check on `/impediments` and `/impediments/{id}` with a seeded local release.
</verification>

<success_criteria>
- User can register an impediment from the UI with title, description, reported date, and affected stories.
- User can inspect affected stories and delivery impact on the detail page.
- User can resolve an impediment exactly once with a required date and optional notes.
- UI remains desktop-first, localized, and consistent with the existing operational app style.
</success_criteria>

