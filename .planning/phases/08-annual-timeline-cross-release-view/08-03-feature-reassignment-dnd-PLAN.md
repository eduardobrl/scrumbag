---
phase: 08
plan: 03
type: execute
wave: 3
depends_on: [08-01-annual-timeline-data, 08-02-annual-timeline-page]
autonomous: true
requirements_addressed: [TL-02, TL-03]
files_modified:
  - package.json
  - package-lock.json
  - src/lib/features.ts
  - src/app/api/features/[id]/route.ts
  - src/features/timeline/annual-timeline-view.tsx
  - src/features/timeline/feature-move-toast.tsx
  - tests/feature-reassignment.test.ts
  - tests/annual-timeline-dnd.test.tsx
must_haves:
  truths:
    - D-07 clicking a feature cell or bar still navigates to `/features/{id}` when the user is not dragging
    - D-09 feature bars are draggable with dnd-kit using `@dnd-kit/core`
    - D-10 each entire release swimlane is a valid drop target and highlights while hovered
    - D-11 dropping commits immediately in one API call and shows a toast notification with undo
    - D-12 all stories under the moved feature move with the feature, detach from current sprints, and return to BACKLOG
    - D-13 the Timeline nav entry remains available after drag-and-drop work
    - D-14 reassignment happens on the standalone annual page, not through the global release selector
  artifacts:
    - src/lib/features.ts
    - src/app/api/features/[id]/route.ts
    - src/features/timeline/annual-timeline-view.tsx
    - tests/feature-reassignment.test.ts
    - tests/annual-timeline-dnd.test.tsx
  key_links:
    - src/features/sprints/sprint-board.tsx
    - src/features/backlog/plan-story-dialog.tsx
    - src/lib/annual-timeline.ts
    - src/lib/stories.ts
---

# Plan 08-03: Feature Reassignment Drag And Drop

<objective>
Enable users to drag feature bars between release swimlanes on the annual timeline, immediately reassign the feature, detach its stories to backlog, and undo the move from a toast.
</objective>

<context>
This plan completes `TL-03` and depends on the annual data contract and timeline page from Plans 08-01 and 08-02. Do not remove the one-active-release constraint or add smart sprint remapping.
</context>

<task>
<name>Install dnd-kit core</name>
<files>
- `package.json`
- `package-lock.json`
</files>
<action>
- Install `@dnd-kit/core` as a production dependency.
- Keep dependency changes limited to the package files required by npm.
- Do not introduce a separate drag-and-drop library.
</action>
<verify>
- `npm install`
- `npm run lint`
</verify>
<done>
- The codebase can import dnd-kit primitives for the annual timeline.
</done>
</task>

<task>
<name>Add feature reassignment domain logic</name>
<files>
- `src/lib/features.ts`
- `tests/feature-reassignment.test.ts`
</files>
<action>
- Add a `reassignFeatureRelease(featureId, targetReleaseId)` helper.
- Validate that the feature and target release exist.
- Return a no-op success if the target release matches the current release.
- In a transaction, update the feature's `releaseId` and update every story under that feature to `currentSprintId = null` and `status = BACKLOG`.
- Return the updated feature plus enough previous state for the UI to offer undo.
- Add an undo helper that restores the previous release and, when the previous story sprint/status state is valid for that release, restores those story assignments; otherwise leave invalid stories in backlog.
</action>
<verify>
- `npx vitest run tests/feature-reassignment.test.ts`
</verify>
<done>
- Feature reassignment enforces D-12 below the UI and documents undo behavior with tests.
</done>
</task>

<task>
<name>Expose reassignment through the feature API</name>
<files>
- `src/app/api/features/[id]/route.ts`
- `tests/feature-reassignment.test.ts`
</files>
<action>
- Extend `PATCH /api/features/[id]` with an explicit `action: "reassignRelease"` branch.
- Accept `targetReleaseId` and return `{ feature, undo }` on success.
- Add an explicit `action: "undoReassignRelease"` branch that accepts the undo payload from the prior successful move and validates it before applying.
- Preserve existing update and cancel behavior.
- Return `{ errors }` with 400 or 404 status for invalid feature, release, or undo payload.
</action>
<verify>
- `npx vitest run tests/feature-reassignment.test.ts`
- `npm run lint`
</verify>
<done>
- The annual timeline can commit and undo feature moves through one explicit local API route.
</done>
</task>

<task>
<name>Add draggable feature bars and release drop targets</name>
<files>
- `src/features/timeline/annual-timeline-view.tsx`
- `src/features/timeline/feature-move-toast.tsx`
- `tests/annual-timeline-dnd.test.tsx`
</files>
<action>
- Wrap the timeline in `DndContext`.
- Make feature bars draggable with stable feature IDs and source release IDs.
- Make the full release swimlane droppable with target release IDs and visual hover highlighting.
- On drop to a different release, call the reassignment API immediately, refresh the annual timeline data, and show a toast that names the target release.
- Add an undo button in the toast that calls the undo API branch and refreshes data again.
- Preserve feature click navigation when users click without dragging.
- Disable or ignore invalid drops, same-release drops, and moves while another move is pending.
- Keep grid dimensions stable during dragging and while a toast is visible.
</action>
<verify>
- `npx vitest run tests/annual-timeline-dnd.test.tsx`
- `npm run lint`
- Manual browser check on `/timeline` with at least two releases and one feature.
</verify>
<done>
- Users can reassign a feature between releases by dragging across swimlanes and can undo the move from the toast.
</done>
</task>

<task>
<name>Add reassignment regression tests</name>
<files>
- `tests/feature-reassignment.test.ts`
- `tests/annual-timeline-dnd.test.tsx`
</files>
<action>
- Cover successful feature reassignment to another release.
- Cover all moved stories becoming backlog with no current sprint after the initial move.
- Cover undo restoring the previous release and valid prior story state.
- Cover invalid target release and missing feature failures.
- Cover drag/drop API call wiring, same-release no-op behavior, hover/drop target affordance, toast text, and undo action.
</action>
<verify>
- `npx vitest run tests/feature-reassignment.test.ts tests/annual-timeline-dnd.test.tsx`
</verify>
<done>
- Focused tests prove `TL-03` and protect `TL-02` rendering while drag-and-drop is active.
</done>
</task>

<verification>
- `npm install`
- `npx vitest run tests/feature-reassignment.test.ts tests/annual-timeline-dnd.test.tsx`
- `npm run lint`
- `npm run build`
- Manual browser check on `/timeline` dragging a feature between two releases and using undo.
</verification>

<success_criteria>
- `TL-03` is covered by draggable feature bars, release swimlane drop targets, immediate reassignment, persisted release association changes, story detachment to backlog, and undo.
- `TL-02` remains covered after drag-and-drop by preserving annual feature rows, links, status styles, and stable grid layout.
- Reassignment stays local-first and does not introduce external integrations, auth, remote persistence, or multiple active releases.
</success_criteria>

