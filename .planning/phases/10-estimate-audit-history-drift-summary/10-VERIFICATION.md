---
status: passed
phase: 10-estimate-audit-history-drift-summary
verified: 2026-06-11
requirements: [AUD-01, AUD-02, AUD-03, DRF-01]
plans_verified: [10-01, 10-02]
---

# Phase 10 Verification: Estimate Audit History & Drift Summary

## Result

Phase 10 passed verification. The implementation satisfies the phase goal: users can inspect post-go-live estimate changes on stories and see release-level drift from the go-live baseline.

## Must-Have Verification

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AUD-01 | Baseline snapshot is available for drift comparison after PLANNING -> IN_PROGRESS | Passed | `src/lib/release-estimates.ts` baseline read path is used by `getReleaseEstimateDrift()`; `tests/releases.test.ts` verifies captured baseline totals feed drift. |
| AUD-02 | Post-go-live story point/day changes record old value, new value, field, and timestamp | Passed | `src/lib/stories.ts` writes `EstimateChange` rows in the story update transaction; `tests/stories.test.ts` verifies one row per changed estimate field. |
| AUD-03 | Story detail panel shows estimate change history | Passed | `src/app/stories/[id]/edit/page.tsx` fetches story history and `src/features/stories/story-form.tsx` renders chronological history cards; `tests/e2e/stories.spec.ts` verifies browser visibility. |
| DRF-01 | Release-level drift summary compares baseline totals against current totals | Passed | `src/lib/estimate-changes.ts` computes drift and `src/features/releases/release-detail.tsx` renders the Estimate Drift section; `tests/releases.test.ts` and `tests/e2e/releases.spec.ts` verify calculation and UI. |

## Success Criteria

- Post-go-live edits to `storyPoints` and `estimatedDays` create one audit row per changed field: Passed.
- PLANNING and PLANNED estimate edits do not create audit rows: Passed.
- Audit rows include field, old value, new value, timestamp, and optional reason, including explicit null transitions: Passed.
- Story edit UI shows estimate change history only when records exist for an IN_PROGRESS or CLOSED release: Passed.
- Release detail shows Estimate Drift only for IN_PROGRESS or CLOSED releases with a captured baseline: Passed.
- Drift totals compare baseline points/days against current points/days for the same baselined stories: Passed.
- Cancelled baselined stories remain part of the comparison: Passed.
- Stories created after go-live are excluded from drift totals and counted separately: Passed.

## Automated Checks

| Check | Status |
|-------|--------|
| `npm.cmd run db:generate` | Passed |
| `npm.cmd run db:migrate` | Passed |
| `npm.cmd run test -- tests/stories.test.ts` | Passed |
| `npm.cmd run test -- tests/releases.test.ts` | Passed |
| `npm.cmd run test -- tests/stories.test.ts tests/releases.test.ts` | Passed |
| `npm.cmd run test:e2e -- tests/e2e/stories.spec.ts tests/e2e/releases.spec.ts` | Passed |
| `npm.cmd run lint` | Passed with existing warnings |
| `npm.cmd run build` | Passed with existing warnings |
| `gsd-tools query verify.schema-drift 10` | Passed: no schema drift detected |

## Warnings

- `npm.cmd run lint` and `npm.cmd run build` still report pre-existing warnings in `src/lib/releases.ts`, `src/lib/sprints.ts`, `tests/releases.test.ts`, and `tests/sprints.test.ts`.
- Phase 9 has prerequisite code present in source, but Phase 9 `.planning/` summaries are missing. Phase 10 verified against actual source behavior; Phase 9 tracking should be reconciled separately.
- `gsd-tools phase.complete 10` warned that future requirements `AUD-04` and `DRF-02` are listed in the body but absent from the traceability table.

## Conclusion

Phase 10 is complete and passed verification.

