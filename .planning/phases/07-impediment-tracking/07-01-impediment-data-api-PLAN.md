---
phase: 07
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements_addressed: [IMP-01, IMP-03]
files_modified:
  - prisma/schema.prisma
  - src/lib/impediments.ts
  - src/app/api/impediments/route.ts
  - src/app/api/impediments/[id]/route.ts
  - tests/impediments.test.ts
must_haves:
  truths:
    - D-01 stories are selected from all stories in the current release
    - D-02 affected stories are mandatory for every impediment
    - D-03 impediments link to stories only, not directly to sprints
    - D-05 impediment scope is inferred from the release of affected stories
    - D-10 impediments have OPEN and RESOLVED states
    - D-11 resolution captures a required date and optional notes
    - D-12 resolved impediments cannot be reopened
    - D-13 resolving an impediment does not modify affected stories
    - D-14 blocked duration uses business days
    - D-15 delivery impact includes story count, summed estimated days, and blocked business days
    - D-17 unresolved impediments show running blocked days from registration to today
  artifacts:
    - src/lib/impediments.ts
    - src/app/api/impediments/route.ts
    - src/app/api/impediments/[id]/route.ts
    - tests/impediments.test.ts
  key_links:
    - prisma/schema.prisma
    - src/lib/date-utils.ts
    - src/lib/stories.ts
---

# Plan 07-01: Impediment Data And API Foundation

<objective>
Add local persistence, validation, business calculations, and API routes for story-linked impediments within one release context.
</objective>

<context>
This plan covers the foundation for `IMP-01` and `IMP-03`. Do not add dashboard alerts, reports, MCP tools, auth, remote persistence, or cross-release behavior.
</context>

<task>
<name>Extend Prisma schema for impediments</name>
<files>
- `prisma/schema.prisma`
</files>
<action>
- Add `ImpedimentStatus` enum with `OPEN` and `RESOLVED`.
- Add `Impediment` with title, optional description, reported date, optional resolution date, optional resolution notes, status, timestamps, and a many-to-many relation to `Story`.
- Add the matching `impediments` relation to `Story`.
- Add useful indexes for status and reported date.
</action>
<verify>
- `npm run db:migrate`
- `npm run db:generate`
</verify>
<done>
- The schema stores story-only impediment links and resolution metadata.
- Existing release, feature, story, sprint, and leakage relations still generate successfully.
</done>
</task>

<task>
<name>Implement impediment validation and calculations</name>
<files>
- `src/lib/impediments.ts`
- `src/lib/date-utils.ts`
</files>
<action>
- Follow the existing `ValidationResult` style used by story helpers.
- Validate title, optional description, reported date, affected story IDs, resolution date, and resolution notes.
- Reject empty affected-story selections and mixed-release story selections.
- Add create, list-by-release, get-detail, update, and resolve helpers.
- Compute story count, summed estimated days, and blocked business days.
- Use reported date to today for open impediments and reported date to resolution date for resolved impediments.
- Reject resolution for already resolved impediments and never modify affected story status or sprint assignment during resolution.
</action>
<verify>
- `npx vitest run tests/impediments.test.ts`
</verify>
<done>
- `IMP-01` registration rules and `IMP-03` resolution/impact rules are enforced below the UI.
</done>
</task>

<task>
<name>Add impediment API routes</name>
<files>
- `src/app/api/impediments/route.ts`
- `src/app/api/impediments/[id]/route.ts`
</files>
<action>
- Add `GET /api/impediments?releaseId=...` for release-scoped lists.
- Add `POST /api/impediments` for creation.
- Add `GET /api/impediments/[id]` for detail.
- Add `PATCH /api/impediments/[id]` for editable fields and a `resolve` action.
- Return `{ errors }` on failures and `{ impediment }` or `{ impediments }` on success, matching existing API style.
</action>
<verify>
- `npm run lint`
- `npx vitest run tests/impediments.test.ts`
</verify>
<done>
- API accepts valid story-linked impediments and rejects missing stories, invalid release scope, and invalid resolution attempts.
</done>
</task>

<task>
<name>Add data/API regression tests</name>
<files>
- `tests/impediments.test.ts`
</files>
<action>
- Cover successful creation with multiple same-release stories.
- Cover rejection with no affected stories.
- Cover rejection with stories from different releases.
- Cover resolving an impediment and calculating blocked business days.
- Cover rejection when resolving an already resolved impediment.
- Cover that resolving does not change affected story status.
</action>
<verify>
- `npx vitest run tests/impediments.test.ts`
</verify>
<done>
- Focused tests prove data/API behavior for `IMP-01` and `IMP-03`.
</done>
</task>

<verification>
- `npm run db:migrate`
- `npm run db:generate`
- `npx vitest run tests/impediments.test.ts`
- `npm run lint`
</verification>

<success_criteria>
- `IMP-01` is covered at the data/API level by required story-linked registration.
- `IMP-03` is covered at the data/API level by final resolution, resolution date capture, blocked duration calculation, and delivery impact calculation.
- Deferred and out-of-scope items stay out of this plan.
</success_criteria>

