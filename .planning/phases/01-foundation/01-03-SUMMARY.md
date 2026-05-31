---
phase: 01-foundation
plan: 03
subsystem: hierarchy
tags: [hierarchy, parent-child, recursion, sqlite-cte]

requires:
  - phase: 01-01
    provides: "SQLite schema with parent_id and ON DELETE SET NULL"
  - phase: 01-02
    provides: "Full CRUD repository, REST API, React table/form UI"

provides:
  - Hierarchical backlog display with recursive tree rendering
  - Parent-child relationship management in backlog items
  - Circular reference prevention in parent assignment dropdown
  - Recursive SQLite CTE for querying descendant trees

affects:
  - 01-04 (Excel Sync — imported items may include parent relationships)
  - Phase 2 (Squad & Capacity — capacity may roll up by hierarchy)
  - Phase 3 (Sprint Planning — sprint selection may filter by hierarchy)

tech-stack:
  added: []
  patterns:
    - "Recursive CTE in SQLite for transitive closure queries"
    - "Client-side descendant collection to prevent circular parent references"
    - "Nested React component recursion for tree rendering"

key-files:
  created: []
  modified:
    - src/data/backlog-repository.ts
    - server.ts
    - src/components/BacklogList.tsx
    - src/components/BacklogForm.tsx
    - src/App.tsx

key-decisions:
  - "01-02 executor pre-emptively implemented most hierarchy features (findRootItems, findChildren, findDescendants, query params, tree UI, parent dropdown)"
  - "01-03 focused on completing the remaining acceptance criteria: circular reference prevention via descendant exclusion from parent dropdown"
  - "Recursive CTE in SQLite handles descendant queries efficiently for local datasets (hundreds of items max)"

requirements-completed:
  - BACK-02
---

# Phase 1 Plan 03: Hierarchy Summary

**Parent-child relationships for backlog items with hierarchical tree display and circular-reference-safe parent assignment**

## Performance

- **Duration:** ~2 min (inline after subagent stall)
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

### Task 1: Extend repository and API for hierarchy queries (pre-implemented in 01-02)

The 01-02 executor already implemented:
- `BacklogRepository.findRootItems()` — returns items with `parent_id IS NULL`
- `BacklogRepository.findChildren(parentId)` — returns direct children
- `BacklogRepository.findDescendants(rootId)` — recursive CTE returning item + all transitive children
- Server query parameter support: `GET /api/backlog?root=true` and `GET /api/backlog?parent_id=XXX`

### Task 2: Update UI to display hierarchy and assign parents (pre-implemented in 01-02, completed in 01-03)

The 01-02 executor already implemented:
- `BacklogList` recursive tree rendering with depth indicators and expand/collapse
- `BacklogForm` parent dropdown populated from root items
- `App.tsx` fetching root items and refreshing hierarchy after mutations

**Completed in 01-03:**
- Added circular reference prevention: when editing an item, the parent dropdown now excludes the current item AND all its descendants. This is done via client-side recursive fetching of children and building an exclusion set.
- The dropdown still shows all root items when creating a new item (no exclusion needed).

## Files Created/Modified

- `src/data/backlog-repository.ts` — already had hierarchy methods from 01-02
- `server.ts` — already had query param routing from 01-02
- `src/components/BacklogList.tsx` — already rendered recursive tree from 01-02
- `src/components/BacklogForm.tsx` — **modified** to prevent circular references via `descendantIds` exclusion set
- `src/App.tsx` — already fetched root items and handled mutations from 01-02

## Decisions Made

- Accepted that 01-02's executor delivered hierarchy features early (within the walking skeleton + CRUD scope). This is a positive deviation that accelerated delivery.
- Chose client-side recursive fetching over a dedicated `/api/backlog/:id/descendants` endpoint to minimize API surface area while still preventing cycles.

## Deviations from Plan

### 1. [Positive] 01-02 executor pre-delivered hierarchy features

- **Found during:** Review of post-01-02 codebase before spawning 01-03 executor
- **Issue:** 01-02's BacklogList, BacklogForm, and repository already included hierarchy features described in 01-03's task list
- **Impact:** 01-03's scope reduced to circular reference prevention only
- **Verification:** All 01-03 acceptance criteria still met after adding cycle prevention

---

**Total deviations:** 1 positive (scope reduction, no blockers)
**Impact on plan:** Minimal — only cycle prevention required additional code

## Issues Encountered

- 01-03 subagent spawn stalled (runtime-specific issue with `task` tool). Fallback to inline execution succeeded.
- `nul` file in project root caused `git add -A` to fail (Windows reserved device name). Removed and committed specific files.

## User Setup Required

None.

## Next Phase Readiness

- Hierarchy is solid and tested. All downstream plans (01-04, Phase 2, Phase 3) can use parent-child relationships.
- No blockers.

## Self-Check: PASSED

- [x] Repository supports root/children/descendants queries
- [x] UI shows hierarchical tree with indentation
- [x] Parent dropdown prevents circular references
- [x] Hierarchy data persists across server restarts
- [x] All task commits exist in git history

---
*Phase: 01-foundation*
*Plan: 03*
*Completed: 2026-05-31*
