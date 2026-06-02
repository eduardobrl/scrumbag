# Roadmap: Scrumbag

## Overview

Scrumbag is a local-first, single-executable Scrum capacity planning tool. The roadmap delivers the app in five phases: first the foundation and data ingestion, then the core capacity engine, followed by sprint planning and board workflow, then release-centered planning and UX redesign, and finally forecasting and analytics. Each phase builds on the previous to deliver realistic release and sprint capacity planning with delivery forecasting.

## Phases

- [x] **Phase 1: Foundation & Data Ingestion** - Single executable scaffold, SQLite schema, Excel sync, and initial backlog management (completed 2026-05-31)
- [x] **Phase 2: Squad & Capacity Engine** - Squad management, absence tracking, and realistic capacity calculation (completed 2026-05-31)
- [x] **Phase 3: Sprint Planning, Board & Estimation** - Sprint creation, Kanban board, story estimation, and drag-and-drop workflow (completed 2026-06-01)
- [x] **Phase 4: Release Planning & UX Redesign** - Release-first planning, feature timeline by sprint, dedicated sprint screens, and clearer backlog creation (completed 2026-06-02)
- [ ] **Phase 5: Forecasting, Velocity & Analytics** - Velocity tracking, burndown chart, and probabilistic release/feature forecasting

## Phase Details

### Phase 1: Foundation & Data Ingestion

**Goal**: The app runs as a single executable, stores data locally in SQLite, and imports Excel files from the OneDrive-synced folder into the backlog.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: BACK-01, BACK-02, SYNC-01, SYNC-02
**Success Criteria** (what must be TRUE):

  1. User can launch the app by running a single file without installation
  2. User can create and manage backlog items (stories, features, bugs, epics)
  3. User can organize work items in hierarchy (epics → features → stories)
  4. User can place Excel files in the synced folder and the app automatically detects and imports the data

**Plans**: 4 plans

Plans:

- [x] 01-01-PLAN.md — Walking Skeleton: project scaffold, SQLite schema, Bun server, minimal React SPA with one DB read/write and one UI interaction
- [x] 01-02-PLAN.md — Backlog CRUD: domain types, full repository CRUD, REST API with validation, rich React list and form UI
- [x] 01-03-PLAN.md — Hierarchy: parent-child relationships, recursive queries, nested backlog tree view, parent assignment in forms
- [x] 01-04-PLAN.md — Excel Sync: chokidar file watcher, SHA-256 content hashing, SheetJS parser, import service, sync config UI

### Phase 2: Squad & Capacity Engine

**Goal**: Users can manage their squad, register absences and holidays, and view realistic sprint capacity adjusted for availability and waste.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: TEAM-01, TEAM-02, CAP-01, CAP-02, CAP-03
**Success Criteria** (what must be TRUE):

  1. User can register squad members with name, role, and typical daily capacity
  2. User can register absences, vacations, unpaid leave, and holidays for any member
  3. User can view a realistic capacity calculation for any date range, adjusted for absences and holidays
  4. User can view a capacity calculation that accounts for waste/overhead (meetings, support, incidents)
  5. User can see a transparent breakdown of the capacity calculation and manually override the result

**Plans**: 3 plans

Plans:

- [x] 02-01-PLAN.md — Squad & Absences: squad member CRUD, absence tracking with holidays, REST API, and React UI
- [x] 02-02-PLAN.md — Capacity Engine: working-day calculation, absence/holiday deduction, per-member breakdown API and UI
- [x] 02-03-PLAN.md — Waste, Transparency & Override: configurable waste percentage, capacity breakdown with waste, manual override for specific members and dates

### Phase 3: Sprint Planning, Board & Estimation

**Goal**: Users can plan sprints, estimate work in story points and days, and manage daily workflow on a Kanban board.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: BACK-03, SPRT-01, SPRT-02, SPRT-03, SPRT-04, EST-01, EST-02
**Success Criteria** (what must be TRUE):

  1. User can create sprints with start date, end date, and goal, and select backlog items to include
  2. User can estimate stories using Fibonacci story points (1, 2, 3, 5, 8, 13, 21) and work days
  3. User can view a sprint board with To Do, In Progress, and Done columns
  4. User can move items between board columns and prioritize backlog via drag-and-drop

**Plans**: 4 plans
**UI hint**: yes
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Sprint & Estimation Foundation: sprint schema, sprint CRUD, estimate fields, API routes, and sprint list UI

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Planning Workspace & Capacity: two-column backlog/sprint workspace, sprint membership, totals, and advisory capacity warnings

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Drag-and-Drop Planning: backlog priority reorder, sprint add/order drag-and-drop, and persisted ordering

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04-PLAN.md — Sprint Board & Closure: three-column board, completion date prompt, board ordering, and close sprint action

### Phase 4: Release Planning & UX Redesign

**Goal**: Users plan work from a release-first view: releases contain features, features contain stories and bugs, sprints belong to releases, and the UI makes sprint boards and backlog creation unambiguous.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, UX-01, UX-02
**Success Criteria** (what must be TRUE):

  1. User creates a release before creating or planning its sprints
  2. User adds features to a release, including during release execution
  3. System prevents stories and bugs from existing without a parent feature
  4. User sees a release planning board/timeline with features across sprint columns and predicted completion by sprint
  5. User can expand or shrink feature allocation across sprints and receives capacity warnings when scope exceeds available capacity
  6. System suggests splitting a feature when its scope is too large for the release
  7. User opens a sprint into a dedicated sprint screen with tabs instead of seeing all sprint UI on the list page
  8. User manages backlog through a clearer feature-first creation flow

**Plans**: 5 plans
**UI hint**: yes
**Sketch needed**: release board/timeline with feature drag/drop, resizable feature spans, capacity alerts, and sprint drill-down tabs

Plans:
**Wave 1**

- [x] 04-01-PLAN.md - Release Data Foundation: release schema, release-scoped sprints, feature membership, and story/bug parent guards

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md - Release Planning Service: board summary, feature allocation spans, predicted completion, capacity warnings, and split suggestions

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md - Release-First Planning UI: Releases tab, release detail screen, feature backlog panel, and sprint-column timeline

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md - Dedicated Sprint Screen: sprint drill-down with Board, Planning, Capacity, and Closure tabs

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 04-05-PLAN.md - Feature-First Backlog: feature-centered backlog management and child story/bug creation flow

### Phase 5: Forecasting, Velocity & Analytics

**Goal**: Users can track team velocity, view a burndown chart, and receive probabilistic forecasts for release and feature delivery with confidence intervals.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: VEL-01, BURN-01, FORE-01, FORE-02
**Success Criteria** (what must be TRUE):

  1. System displays rolling average velocity based on completed story points from recent sprints
  2. System displays a burndown chart comparing ideal vs actual remaining effort
  3. System forecasts release and feature delivery with confidence intervals (ranges, not single dates)
  4. System automatically updates forecasts when release or feature scope changes

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Ingestion | 4/4 | Complete   | 2026-05-31 |
| 2. Squad & Capacity Engine | 3/3 | Complete    | 2026-05-31 |
| 3. Sprint Planning, Board & Estimation | 4/4 | Complete    | 2026-06-01 |
| 4. Release Planning & UX Redesign | 5/5 | Complete    | 2026-06-02 |
| 5. Forecasting, Velocity & Analytics | 0/TBD | Not started | - |
