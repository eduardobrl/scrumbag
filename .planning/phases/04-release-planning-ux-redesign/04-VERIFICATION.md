---
phase: 04-release-planning-ux-redesign
status: passed
verified_at: 2026-06-01T22:10:20-03:00
requirements:
  - REL-01
  - REL-02
  - REL-03
  - REL-04
  - REL-05
  - REL-06
  - UX-01
  - UX-02
---

# Phase 04 Verification: Release Planning & UX Redesign

## Result

Status: passed

Users now plan from a release-first entry point. Releases own sprints, releases contain features, stories and bugs are constrained to feature parents, release board summaries expose sprint-column planning data, feature allocations can span sprints, capacity warnings and split suggestions are available, sprint execution opens in a dedicated tabbed screen, and backlog creation is feature-first.

## Must-Have Checks

| Check | Status | Evidence |
|-------|--------|----------|
| User creates a release before planning sprints | passed | Releases tab, `ReleaseForm`, `ReleaseDetailScreen`, `POST /api/releases/:id/sprints` |
| User adds features to a release | passed | `ReleaseFeatureBacklog`, `ReleaseRepository.addFeature`, `POST /api/releases/:id/features` |
| System prevents orphan stories and bugs | passed | `BacklogRepository.validateExecutableParent`, SQLite triggers in `schema.ts`, API 400 handling |
| Release board/timeline organized by sprints | passed | `ReleaseFeatureTimeline`, `GET /api/releases/:id/board` |
| Feature allocation spans one or more sprints | passed | `ReleaseRepository.updateFeatureAllocation`, `PUT /api/releases/:id/features/:featureId/allocation` |
| Predicted completion and capacity warnings | passed | `ReleasePlanningService`, `ReleaseCapacitySummary`, feature timeline warnings |
| Oversized feature split suggestion | passed | `ReleasePlanningService.splitSuggestion`, `FeatureSplitSuggestion` |
| Sprint opens in dedicated screen with tabs | passed | `SprintDetailScreen` tabs: Board, Planning, Capacity, Closure |
| Backlog feature-first creation flow | passed | `FeatureFirstBacklog`, `FeatureCard`, `BacklogForm` feature/child modes |

## Automated Checks

- `bun run build` passed.
- `bun test` passed: 1 test, 10 assertions.
- Schema drift gate passed: `drift_detected=false`.
- API smoke passed against a temporary local server:
  - Created temporary release.
  - Created temporary feature.
  - Created temporary story under the feature.
  - Added feature to release.
  - Fetched release board summary with 1 feature and 1 estimated day.
  - Removed temporary release/story/feature after the smoke.

## Browser/UI Verification

The in-app Browser plugin did not expose a callable browser tool in this session, and Playwright was not installed in the local Node runtime. UI verification was therefore limited to Vite build, component-level test coverage, and API smoke. Manual browser UAT is still recommended for drag/drop feel, mobile horizontal timeline scrolling, and visual polish.

## Residual Risk

- The sync watcher logged a pre-existing runtime issue while processing `synced/sample.xlsx`: `Bun.crypto.subtle` was undefined in Bun 1.3.13. This is outside the Phase 4 release planning changes, but it should be investigated before relying on Excel sync verification.
- Timeline span controls are keyboard-accessible selects for the MVP. Pointer resize handles were not added.
- Capacity allocation distributes feature estimate days evenly across the selected span. Phase 5 forecasting may refine this.

## Human Verification

Optional:

1. Open the Releases tab in the browser.
2. Create a release and two sprints inside it.
3. Create a feature in Backlog, add a story/bug under it, then add the feature to the release.
4. Allocate the feature across sprints and verify warnings/complete marker are understandable.
5. Open a sprint and verify Board, Planning, Capacity, and Closure tabs.

