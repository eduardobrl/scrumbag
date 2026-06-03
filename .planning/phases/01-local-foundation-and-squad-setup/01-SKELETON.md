# Walking Skeleton - Squad Planner

**Phase:** 1
**Generated:** 2026-06-02

## Capability Proven End-to-End

A local user can start Squad Planner, open the browser on localhost, create a squad member from the app shell, and see that member persisted from SQLite after refresh.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js App Router with TypeScript | Matches the project constraint and supports a local full-stack app with route handlers and desktop UI. |
| Styling | Tailwind CSS with small local components | Keeps the UI fast to build, information-dense, and consistent without adding a heavy design system in Phase 1. |
| Data layer | Prisma ORM with SQLite at `./data/squad-planner.db` | Matches the local-first persistence guardrail and gives later phases typed models for releases, sprints, features, and stories. |
| Runtime boundary | Localhost-only Next.js dev server | Phase 1 proves the app runs locally without auth, remote DB, or external integrations. |
| Directory layout | App Router routes in `src/app`, reusable UI in `src/components`, data access in `src/lib`, domain logic in `src/features` | Separates UI, data access, and phase-specific domain helpers while staying simple for a small local app. |
| Testing | Vitest for domain/data helpers and Playwright for the first browser smoke path | Gives fast regression coverage for persistence and a real browser check for localhost usability. |

## Stack Touched in Phase 1

- [ ] Project scaffold with Next.js, TypeScript, Tailwind, Prisma, lint, build, test scripts
- [ ] Routing for Dashboard, Releases, Features/Stories, Backlog, Sprints, Squad, Reports, Assistant AI, and Settings
- [ ] Database read and write for app settings, squad members, absences, and holidays
- [ ] UI interaction for creating/editing squad members and settings from localhost
- [ ] Local run command documented and verified with `npm run dev`

## Out of Scope (Deferred to Later Slices)

- Multi-user authentication, roles, and permissions
- Remote database or network exposure beyond localhost
- Release creation and sprint generation, except placeholder navigation/context
- Feature, story, backlog, board, timeline, reports, MCP tools, and AI chat implementation
- Drag-and-drop sprint board and capacity engine calculations beyond Phase 1 summary placeholders
- External Jira, Azure DevOps, Trello, GitHub, or SaaS integrations

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its local-first decisions:

- Phase 2: Release and sprint planning core on the existing app shell and SQLite data layer
- Phase 3: Feature, story, and backlog planning using the established route, table, and form patterns
- Phase 4: Sprint board, capacity engine, and leakage history using the squad/calendar data from Phase 1
- Phase 5: Dashboard intelligence, reports, local MCP, and AI assistant surfaces
