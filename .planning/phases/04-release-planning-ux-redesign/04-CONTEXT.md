---
phase: 04-release-planning-ux-redesign
created: 2026-06-01
source: gsd-explore
---

# Phase 04 Context: Release Planning & UX Redesign

## Problem

The current sprint UX puts sprint creation, selection, planning workspace, and sprint board on the same screen. This makes it unclear what is selected and what the user is supposed to do next.

The backlog creation flow is also confusing because it exposes too many item concepts at once and permits ambiguous planning structures.

## Product Direction

Planning should become release-first:

1. A release is created before its sprints.
2. A release contains features.
3. Features contain stories and bugs.
4. Stories and bugs must not exist without a parent feature.
5. Sprints belong to a release.
6. Sprint scope is chosen from stories and bugs inside the release's features.

Epics may remain as an optional portfolio layer above features, but they should not be mandatory for release or sprint planning.

## Desired UX

The main release screen should start from features, not from sprints.

The release planning view should behave like a board/timeline:

- Available features can be dragged into a release.
- Release sprints appear as timeline columns.
- A feature can span one or more sprints.
- The user can expand or shrink a feature span manually.
- The UI shows the predicted sprint where each feature will complete.
- Capacity warnings appear when a feature or sprint allocation exceeds available capacity.
- If a feature is too large for the release, the system should suggest splitting it.

Sprint list and sprint board should be separated:

- The sprint list remains a place to browse available sprints.
- Clicking a sprint opens a dedicated sprint screen.
- The sprint screen should use tabs such as Board, Planning, Capacity, and Closure.

Backlog management should become feature-first:

- Creating stories and bugs should happen inside a feature context.
- The form should reduce ambiguity around type, parent, and status.
- Root-level work should primarily be features, with optional epics above them.

## Open Design Questions

- Should feature spans be sized by total estimated days, story points, or manual user sizing with advisory capacity math?
- Should the release timeline show stories/bugs inside each feature by default, or only after expanding the feature?
- Should adding a feature to an in-progress release require a visible change note or warning?
- Should oversized-feature splitting be a lightweight suggestion or a guided workflow?
