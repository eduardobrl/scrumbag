# Roadmap: Scrumbag

## Overview

Scrumbag is a local-first, single-executable Scrum capacity planning tool. The roadmap delivers the app in four phases: first the foundation and data ingestion, then the core capacity engine, followed by sprint planning and board workflow, and finally forecasting and analytics. Each phase builds on the previous to deliver realistic sprint capacity planning and epic forecasting.

## Phases

- [ ] **Phase 1: Foundation & Data Ingestion** - Single executable scaffold, SQLite schema, Excel sync, and initial backlog management
- [ ] **Phase 2: Squad & Capacity Engine** - Squad management, absence tracking, and realistic capacity calculation
- [ ] **Phase 3: Sprint Planning, Board & Estimation** - Sprint creation, Kanban board, story estimation, and drag-and-drop workflow
- [ ] **Phase 4: Forecasting, Velocity & Analytics** - Velocity tracking, burndown chart, and probabilistic epic forecasting

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
**Plans**: TBD

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
**Plans**: TBD

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
**Plans**: TBD
**UI hint**: yes

### Phase 4: Forecasting, Velocity & Analytics
**Goal**: Users can track team velocity, view a burndown chart, and receive probabilistic forecasts for epic delivery with confidence intervals.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: VEL-01, BURN-01, FORE-01, FORE-02
**Success Criteria** (what must be TRUE):
  1. System displays rolling average velocity based on completed story points from recent sprints
  2. System displays a burndown chart comparing ideal vs actual remaining effort
  3. System forecasts epic delivery with confidence intervals (ranges, not single dates)
  4. System automatically updates forecasts when epic scope changes
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Ingestion | 0/TBD | Not started | - |
| 2. Squad & Capacity Engine | 0/TBD | Not started | - |
| 3. Sprint Planning, Board & Estimation | 0/TBD | Not started | - |
| 4. Forecasting, Velocity & Analytics | 0/TBD | Not started | - |
