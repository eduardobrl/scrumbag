# Phase 7: Impediment Tracking - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning

## Phase Boundary

Register impediments with affected stories, visualize them as markers on the release timeline, and track resolution with blocked duration and delivery impact. Self-contained per release — no cross-release scope.

## Implementation Decisions

### Impediment Data Model & Registration
- **D-01:** Stories are selected via a multi-select list from all stories in the current release
- **D-02:** Affected stories are mandatory — every impediment must link to at least one story
- **D-03:** Impediments link to stories only (not sprints directly)
- **D-04:** Affected stories displayed as title-only linked list in the impediment detail view
- **D-05:** Impediment per-release scoping — an impediment belongs to the release context of its affected stories (consistent with STATE.md: "Impediment tracking is self-contained per release")

### Timeline Integration
- **D-06:** Impediments appear as a separate row section below feature rows on the existing release timeline
- **D-07:** Visual indicator: colored horizontal span bar across affected sprint columns, in a distinct color from feature bars
- **D-08:** Resolved impediments display a check mark on their timeline bar
- **D-09:** Hover tooltip only on timeline bars (no click navigation) — shows title, dates, affected story count, and delivery impact summary

### Resolution States & Workflow
- **D-10:** Two states: OPEN and RESOLVED
- **D-11:** Resolution captures a required date and optional notes
- **D-12:** Resolved impediments cannot be reopened (resolution is final)
- **D-13:** Impediment resolution is independent from story status — resolving an impediment does not modify affected stories

### Delivery Impact
- **D-14:** Blocked duration calculated in business days (consistent with app's capacity model)
- **D-15:** Delivery impact metrics: story count + summed estimated days + blocked business days
- **D-16:** Delivery impact shown on the impediment detail page (summary card) and compact version in the timeline hover tooltip
- **D-17:** For unresolved impediments: show running blocked days (registration → today) + story count + estimated days

### the agent's Discretion

- **Agent discretion:** Color choice for impediment bars on the timeline (should be visually distinct from feature teal, sprint greens, and leakage amber)

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & Screen Specs
- `spec.md` — Original product specification covering sprint planning concepts
- `telas.md` — Screen specifications and UI mockups

### Project-Level
- `.planning/PROJECT.md` — Stack, constraints, capacity model, key decisions
- `.planning/REQUIREMENTS.md` — IMP-01, IMP-02, IMP-03 requirements and traceability
- `.planning/ROADMAP.md` — Phase 7 success criteria and scope boundary
- `.planning/STATE.md` — v1.1 decisions (one-active-release, per-release impediment scope)

### Existing Code
- `src/lib/timeline.ts` — `buildTimelineData()` and `TimelineData` types (integration target)
- `src/features/dashboard/timeline-view.tsx` — Existing timeline component (visual reference)
- `src/features/stories/story-form.tsx` — Form pattern to follow for impediment form
- `src/lib/db.ts` — Prisma client singleton
- `prisma/schema.prisma` — Current data model (add Impediment model)
- `src/lib/navigation.ts` — Navigation items (add impediment nav entry)
- `src/messages/en.json` / `src/messages/pt-BR.json` — i18n message files (add impediment keys)

## Existing Code Insights

### Reusable Assets
- **`TimelineView` component** (`src/features/dashboard/timeline-view.tsx`): CSS-grid timeline with sprint columns and feature rows — impediment row extends this pattern
- **`buildTimelineData()`** (`src/lib/timeline.ts`): Aggregate sprint/feature/leakage data for timeline — impediment data will be added to `TimelineData` type
- **`StoryForm` pattern** (`src/features/stories/story-form.tsx`): Form pattern with fetch API, useTransition, server error handling — follow for impediment form
- **`Card`, `Badge`, `Button`, `Input`** components: Reusable UI primitives
- **`countBusinessDaysInRange()`** (`src/lib/date-utils.ts`): Existing function for business day calculation — reuse for blocked duration

### Established Patterns
- **Form pattern**: "use client", useState per field, fetch API POST/PATCH, useTransition for navigation
- **Page pattern**: Server component fetches data via lib functions, passes to client feature components
- **API route pattern**: Next.js route handlers, `prisma` import, standard CRUD
- **i18n pattern**: next-intl with messages in `src/messages/{en,pt-BR}.json`, `useTranslations()` in client components
- **Navigation pattern**: `navigationItems` array in `src/lib/navigation.ts`, lucide-react icons, releaseId passthrough

### Integration Points
- **Timeline**: `TimelineData` type in `src/lib/timeline.ts` needs a new `impediments` field; `TimelineView` needs an impediment row section
- **Dashboard**: `src/app/page.tsx` already loads timeline data — impediments appear when page loads
- **Navigation**: New nav item in `navigationItems` array and both message files
- **DB**: New Prisma model `Impediment` with relations to `Story` (and implicit `Release` via stories)
- **Prisma schema sync**: `npm run db:sync` after schema change

## Specific Ideas

No specific references or "I want it like X" moments — decisions above are the full picture.

## Deferred Ideas

- **IMP-04 (Dashboard alerts for unresolved impediments):** Deferred to future milestone (per REQUIREMENTS.md)
- **IMP-05 (CSV/Excel impediment export):** Deferred to future milestone (per REQUIREMENTS.md)
- **Sprint-level impediments (without stories):** Discussed and rejected — stories-only model chosen

---

*Phase: 7-Impediment Tracking*
*Context gathered: 2026-06-06*
