---
phase: 04-release-planning-ux-redesign
artifact: sketch-brief
created: 2026-06-01
---

# Sketch Brief: Release Board / Timeline

## Objective

Sketch the main release planning screen before implementation. The interaction model should make release scope, sprint allocation, capacity warnings, and predicted feature completion understandable at a glance.

## Primary Screen

Release detail screen, default tab: Features.

Suggested tabs:

- Features
- Sprints
- Capacity
- Forecast

## Layout Concept

Left rail or panel:

- Feature backlog available for the release
- Feature cards with title, status, total estimate, number of stories/bugs, and optional epic label
- Drag handle for adding a feature to the release

Main area:

- Sprint timeline columns
- Feature rows/cards spanning one or more sprint columns
- Resize handles at the start/end of a feature span
- Expand control to reveal stories and bugs inside the feature
- Predicted completion marker, for example "Completes in Sprint 3"

Capacity feedback:

- Per-sprint capacity indicator in each sprint column header
- Warning state when a sprint is over capacity
- Release-level warning when feature scope does not fit the release
- Suggestion affordance for "split feature" when a feature is too large

Sprint drill-down:

- Clicking a sprint opens a dedicated sprint screen
- Sprint screen uses tabs for Board, Planning, Capacity, and Closure

## UX Principles

- Release planning is manual, with advisory capacity warnings.
- The user decides what goes into each sprint; the system explains consequences.
- Features are the planning unit at release level.
- Stories and bugs are execution units inside features and sprint boards.
- Avoid rendering release planning, sprint board, and backlog CRUD all on the same screen.

## Acceptance Notes For Sketch

- The first viewport should clearly show that the user is planning a release, not editing generic backlog.
- It should be visually obvious which features are in the release and which are still available.
- It should be visually obvious which sprint a feature is predicted to finish in.
- Over-capacity states should be noticeable but not block manual planning.
- The backlog creation path should encourage creating a feature first, then adding stories or bugs inside it.
