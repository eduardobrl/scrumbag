---
status: passed
phase: 04-sprint-board-capacity-engine-and-leakage
verified: 2026-06-03
requirements:
  - BOARD-01
  - BOARD-02
  - BOARD-03
  - BOARD-04
  - CAP-01
  - CAP-02
  - CAP-03
  - CAP-04
  - CAP-05
  - SPR-04
  - SPR-05
  - SPR-06
  - SPR-07
  - SPR-08
---

# Phase 04 Verification: Sprint Board, Capacity Engine, And Leakage

## Result

Passed. Phase 4 delivers the operational sprint board, real sprint capacity calculations, over-capacity warnings, sprint close/reopen, unfinished-story leakage migration, and leakage history display.

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| BOARD-01 | Passed | `src/features/sprints/sprint-board.tsx` renders "Backlog da Sprint", "Em Execucao", and "Finalizado". |
| BOARD-02 | Passed | Board drag/drop calls `PATCH /api/stories/{id}/status`; `tests/sprint-board.test.ts` covers status-column mapping. |
| BOARD-03 | Passed | `src/features/sprints/add-story-dialog.tsx` lists unplanned backlog stories and confirms through `/api/stories/{id}/plan`. |
| BOARD-04 | Passed | Sprint detail/list show gross capacity, net capacity, planned effort, remaining, occupancy, and risk. |
| CAP-01 | Passed | `tests/capacity.test.ts` verifies gross capacity from active members and business days. |
| CAP-02 | Passed | `tests/capacity.test.ts` verifies absence and holiday reductions. |
| CAP-03 | Passed | `tests/capacity.test.ts` verifies meeting/support percentage reductions. |
| CAP-04 | Passed | `tests/capacity.test.ts` verifies net hours normalized into 8-hour days. |
| CAP-05 | Passed | `tests/sprint-planning-summary.test.ts` verifies over-capacity risk labels; UI shows danger alert while planning remains allowed. |
| SPR-04 | Passed | `validateSprintClosure` rejects non-IN_PROGRESS sprints; API tests cover 400 response. |
| SPR-05 | Passed | `tests/sprint-closure.test.ts` verifies DONE stories stay and unfinished stories move. |
| SPR-06 | Passed | `tests/sprint-closure.test.ts` verifies auto-created next sprint when none exists. |
| SPR-07 | Passed | `tests/sprint-closure.test.ts` verifies leakage history rows with origin, destination, and status. |
| SPR-08 | Passed | `tests/sprint-closure.test.ts` and E2E verify reopen preserves leakage history. |

## Automated Checks

| Check | Result |
|-------|--------|
| `npm.cmd run test` | Passed: 13 test files, 70 tests |
| `npm.cmd run lint` | Passed with existing warnings only |
| `npm.cmd run build` | Passed |
| `npm.cmd run test:e2e` | Passed: 18 browser tests |
| `node .codex/get-shit-done/bin/gsd-tools.cjs query verify.schema-drift 04` | Passed: no drift detected |

## Notes

- The first Playwright run failed because a stale local Node process held port 3000 and returned HTTP 500. The stale process was stopped and the suite passed on rerun.
- Regression tests were updated from Phase 3 placeholder expectations to Phase 4 real capacity behavior.

## Verdict

Phase 4 is verified and ready to mark complete.
