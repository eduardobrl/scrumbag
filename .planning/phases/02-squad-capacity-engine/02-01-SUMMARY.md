---
phase: 02-squad-capacity-engine
plan: 01
subsystem: capacity
tags: [react, bun, sqlite, zod, date-fns, squad, absences]

requires:
  - phase: 01-foundation
    provides: Bun server, SQLite schema, React SPA, repository pattern, backlog CRUD UI
provides:
  - Squad member CRUD persisted in SQLite
  - Absence CRUD persisted in SQLite
  - Squad-wide holidays represented as absences with member_id null
  - REST API endpoints for squad members and absences
  - React tabs and forms for Squad and Ausencias
affects: [02-squad-capacity-engine, 02-02-capacity-engine, sprint-planning]

tech-stack:
  added: [date-fns@4.4.0]
  patterns: [repository CRUD classes, Zod-validated REST routes, controlled React forms]

key-files:
  created:
    - src/data/squad-repository.ts
    - src/data/absence-repository.ts
    - src/components/SquadMemberForm.tsx
    - src/components/SquadMemberList.tsx
    - src/components/AbsenceForm.tsx
    - src/components/AbsenceList.tsx
  modified:
    - package.json
    - bun.lock
    - src/data/schema.ts
    - src/domain/types.ts
    - server.ts
    - src/App.tsx

key-decisions:
  - "Use date-fns@4.4.0 for later date-range and working-day calculations."
  - "Model squad-wide holidays as absences with member_id set to null."
  - "Keep squad and absence persistence in repository classes matching the existing BacklogRepository pattern."
  - "Allow PORT to configure the Bun server so API verification can use a clean port without editing source."

patterns-established:
  - "New Phase 2 data access follows the existing repository pattern with parameterized SQLite queries."
  - "Phase 2 UI tabs use controlled forms plus table list components, matching the Phase 1 backlog UI."
  - "Absence member_id null is the canonical representation for squad-wide holidays."

requirements-completed: [TEAM-01, TEAM-02]

duration: 43 min
completed: 2026-05-31
---

# Phase 2 Plan 1: Squad & Absences Summary

**Squad member and absence management with SQLite persistence, Zod-validated REST endpoints, and React CRUD tabs.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-05-31T13:11:36Z
- **Completed:** 2026-05-31T13:54:20Z
- **Tasks:** 5
- **Files modified:** 10

## Accomplishments

- Added `squad_members` and `absences` tables, including nullable `member_id` for squad-wide holidays.
- Added `SquadRepository` and `AbsenceRepository` with CRUD methods and absence queries needed by the capacity engine.
- Added Zod-validated `/api/squad` and `/api/absences` endpoints, including `/api/absences/holidays`.
- Added Squad and Ausencias tabs with forms and tables for creating, editing, and deleting members and absences.
- Verified API flows with REST calls and verified UI flows in the browser.

## Task Commits

1. **Task 1: Install date-fns and extend schema** - `ca69c34`
2. **Task 2: Create SquadRepository and AbsenceRepository** - `87a591e`
3. **Task 3: Add REST API endpoints for squad and absences** - `e5b6507`, `4354c1a`
4. **Task 4: Create React UI for squad members** - `33de65c`
5. **Task 5: Create React UI for absences** - `33de65c`

**Plan metadata:** included in the docs close-out commit.

## Files Created/Modified

- `package.json` - Added `date-fns@4.4.0`.
- `bun.lock` - Locked the new dependency.
- `src/data/schema.ts` - Added `squad_members` and `absences` tables.
- `src/domain/types.ts` - Added squad member and absence domain types.
- `src/data/squad-repository.ts` - Added squad member CRUD repository.
- `src/data/absence-repository.ts` - Added absence CRUD and query repository.
- `server.ts` - Added squad and absence API routes and configurable server port.
- `src/App.tsx` - Added Squad and Ausencias tabs and CRUD handlers.
- `src/components/SquadMemberForm.tsx` - Added squad member create/edit form.
- `src/components/SquadMemberList.tsx` - Added squad member table.
- `src/components/AbsenceForm.tsx` - Added absence create/edit form.
- `src/components/AbsenceList.tsx` - Added absence table with Portuguese labels.

## Decisions Made

- Holidays are stored as absences with `member_id = null` so a single record can apply to the whole squad.
- Capacity-specific tables for waste and overrides stay deferred to `02-03`, keeping this plan scoped to squad and absence inputs.
- The server port is environment-configurable via `PORT`, which prevents future verification from mutating `server.ts` just to avoid port conflicts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hardcoded verification port**
- **Found during:** Task 3 verification
- **Issue:** `server.ts` was left hardcoded to port `3002` while the log still reported `3000`.
- **Fix:** Added `const port = Number(process.env.PORT ?? 3000)` and used it for `Bun.serve` and startup logging.
- **Files modified:** `server.ts`
- **Verification:** API verification passed on `PORT=3002`.
- **Committed in:** `4354c1a`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix reduced verification fragility without changing product behavior.

## Issues Encountered

- Port `3000`/`3002` conflicts from prior server runs were handled by checking the listening process and using `PORT=3002`.
- The pre-existing `Bun.crypto.subtle` watcher error still occurs when the sync folder contains `sample.xlsx`; it is unrelated to this plan and did not block squad/absence API or UI verification. Final local server was started with `SYNC_FOLDER=./dist` to avoid the noisy watcher path.

## Verification

- `bun run build` passed.
- REST verification passed for create/list/update/delete squad members, create/list/delete absences, squad-wide holiday creation, `/api/absences/holidays`, invalid date range `400`, and missing delete `404`.
- Browser verification passed for creating a squad member from the Squad tab and creating an absence from the Ausencias tab.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan `02-02` can build directly on the committed squad and absence repositories, APIs, and domain types. The capacity engine should use `AbsenceRepository.findByDateRange()` and treat `member_id = null` rows as holidays that apply to every member.

---
*Phase: 02-squad-capacity-engine*
*Completed: 2026-05-31*
