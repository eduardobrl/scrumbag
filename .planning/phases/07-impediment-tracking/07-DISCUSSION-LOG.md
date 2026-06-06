# Phase 7: Impediment Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-06
**Phase:** 07-Impediment Tracking
**Areas discussed:** Affected stories selection, Timeline marker UX, Resolution states & workflow, Delivery impact display

---

## Affected Stories Selection

### Q1: How should the user pick which stories an impediment blocks?

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select list | Pick from a searchable list of all stories in the current release | ✓ |
| Feature-backed tree | Navigate a feature → story tree to pick affected stories | |
| You decide | Agent picks the best approach | |

**Notes:** Consistent with existing story list patterns; works well with up to ~1000 stories.

### Q2: Should affected stories be mandatory?

| Option | Description | Selected |
|--------|-------------|----------|
| Mandatory | Every impediment must link to at least one story | ✓ |
| Optional | Impediments can be created without stories | |

### Q3: Can an impediment target a sprint directly?

| Option | Description | Selected |
|--------|-------------|----------|
| Stories only | Impediments only link to stories | ✓ |
| Stories and sprints | Can link to sprints OR stories | |

### Q4: How should affected stories be displayed in the impediment detail?

| Option | Description | Selected |
|--------|-------------|----------|
| Title only | Just linked story titles | ✓ |
| Full story context | Title, status badge, sprint, estimated days | |
| You decide | Agent decides | |

---

## Timeline Marker UX

### Q1: Where should impediments appear on the timeline?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate impediment row | New section row below features | ✓ |
| Markers on feature bars | Small icons overlaid on affected feature bars | |
| You decide | Agent decides | |

### Q2: What visual indicator?

| Option | Description | Selected |
|--------|-------------|----------|
| Colored span bar | Horizontal bar across affected sprints, distinct color | ✓ |
| Icon marker at start date | Icon at the impediment's start position | |
| Bar + icon | Both bar and icon | |

### Q3: Resolved vs unresolved appearance?

| Option | Description | Selected |
|--------|-------------|----------|
| Resolved gets check mark | Check mark on resolved impediment bars | ✓ |
| Color-coded by status | Amber for open, neutral for resolved | |
| Uniform appearance | All impediments look the same | |

### Q4: Click/hover behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Hover tooltip only | Tooltip with title, dates, story count | ✓ |
| Click navigates to detail | Click opens impediment detail/edit page | |
| Hover tooltip + link | Tooltip with link to detail page | |

---

## Resolution States & Workflow

### Q1: What states?

| Option | Description | Selected |
|--------|-------------|----------|
| OPEN / RESOLVED | Binary state model | ✓ |
| OPEN / IN_PROGRESS / RESOLVED | Three-state workflow | |

### Q2: What fields on resolution?

| Option | Description | Selected |
|--------|-------------|----------|
| Date + optional notes | Required resolution date, optional notes | ✓ |
| Resolution date only | Just the date | |

### Q3: Can resolved be reopened?

| Option | Description | Selected |
|--------|-------------|----------|
| No reopening | Resolution is final | ✓ |
| Allow reopening | Can return to OPEN | |

### Q4: Does resolution affect story status?

| Option | Description | Selected |
|--------|-------------|----------|
| Independent | Resolution does not touch story statuses | ✓ |
| Auto-revert story status | Revert stories to pre-impediment status | |

---

## Delivery Impact Display

### Q1: How is blocked duration calculated?

| Option | Description | Selected |
|--------|-------------|----------|
| Business days | Count business days between reg and resolution | ✓ |
| Calendar days | Count calendar days | |

### Q2: Which metrics define delivery impact?

| Option | Description | Selected |
|--------|-------------|----------|
| Story count + estimated days + blocked duration | Complete picture of what was at stake | ✓ |
| Blocked duration only | Simplest measure | |
| Story count + blocked duration | Middle ground | |

### Q3: Where is delivery impact shown?

| Option | Description | Selected |
|--------|-------------|----------|
| Detail page + timeline tooltip | Impact on detail page and compact summary on hover | ✓ |
| Detail page only | Summary card on detail page | |
| Detail page + visual on timeline | Thicker bar = more impact | |

### Q4: What to show for unresolved impediments?

| Option | Description | Selected |
|--------|-------------|----------|
| Running blocked days + story count | Running count from registration to today | ✓ |
| Story metrics only | No duration until resolved | |
| Placeholder until resolved | Warning message | |

---

## the agent's Discretion

- Color choice for impediment bars on the timeline (should be distinct from existing teal/green/amber)

## Deferred Ideas

- IMP-04 (Dashboard alerts for unresolved impediments) — future milestone
- IMP-05 (CSV/Excel impediment export) — future milestone
- Sprint-level impediments without stories — discussed and rejected
