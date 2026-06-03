# Squad Planner

## What This Is

Squad Planner is a local web app for planning and tracking a squad release from scope definition through sprint execution. It helps a squad register members, absences, holidays, releases, sprints, features, and stories, then compares planned effort against available capacity and highlights delivery risk.

The first version is desktop-first, runs on localhost, stores data in SQLite, and includes a local MCP surface plus an AI assistant so agents can query the plan, explain risk, and suggest changes without applying sensitive actions automatically.

## Core Value

A squad can see whether a release plan fits the team's real sprint capacity and adjust scope before delivery risk becomes invisible.

## Requirements

### Validated

- [x] Phase 1 delivered a localhost-only Next.js app shell with SQLite persistence, navigation, global header context, settings, and squad/calendar management.
- [x] User can create and maintain local squad members, absences, holidays, and capacity defaults with data persisted at `./data/squad-planner.db`.
- [x] Phase 2 delivered release creation/editing, one active release guard, generated sprint planning, sprint list/detail, and date/goal editing.
- [x] User can create a release and have sprints generated from the release period. Validated in Phase 2: Release And Sprint Planning Core.
- [x] Phase 3 delivered feature/story CRUD, cancellation, aggregate feature metrics, backlog filters, story-to-sprint planning preview, sprint assignment, return-to-backlog, and planned-effort updates.
- [x] User can create features, split them into estimated stories, and plan stories into sprints with planned-effort impact preview. Validated in Phase 3: Feature, Story, And Backlog Planning.

### Active

- [x] User can run the app locally in a browser with a simple install/start flow. Validated in Phase 1: Local Foundation And Squad Setup.
- [x] User can configure squad members, work schedules, absences, and holidays. Validated in Phase 1: Local Foundation And Squad Setup.
- [ ] User can operate a sprint board and move stories through fixed workflow states.
- [ ] User can close and reopen sprints while preserving leakage history.
- [ ] User can view dashboard, timeline, progress, and capacity alerts for the active release.
- [ ] User can export release planning and tracking reports to CSV or Excel.
- [ ] AI agents can query local planning data through MCP and provide suggestions safely.

### Out of Scope

- Multi-user authentication - the first version is a local single-user planning aid.
- Advanced permissions - no role-based access control is needed without multi-user auth.
- Jira, Azure DevOps, Trello, or GitHub integration - the app complements those tools instead of replacing or synchronizing with them in v1.
- Automatic velocity calculation from story points - capacity is based on estimated business days, not point conversion.
- Mandatory automatic planning - AI can suggest redistribution, but the user remains in control.
- WIP limits - useful later, but not central to release capacity planning.
- Story assignee ownership - v1 plans squad capacity, not individual allocation.
- Multiple active releases or parallel sprint streams - v1 focuses on one active release at a time.
- Blocking dependency management - dependencies can be discussed manually, but are not a formal model in v1.
- Real-time collaborative editing - local-first scope keeps implementation and operations simple.
- Remote database or corporate server deployment - SQLite and localhost are the intended v1 operating model.

## Context

The source context is captured in `spec.md` and `telas.md`. The product is meant to support release planning for a squad that already thinks in releases, sprints, features, and stories, but needs a lightweight local tool to visualize capacity, overflow, leakage, and delivery risk.

The suggested stack is Next.js, TypeScript, SQLite, Prisma, Tailwind CSS, dnd-kit for drag-and-drop, Recharts or a similar chart/timeline library, XLSX/CSV export, and a local Node.js MCP server. The UI should feel like a modern management tool: quiet, information-dense, desktop-first, with side navigation, global release context, tables, badges, progress bars, alerts, and horizontal timelines.

The first version should remain simple to run: `npm install` and `npm run dev`, or a local helper script. Offline operation is required for core planning features; AI quality can depend on whichever local agent/tool the user connects, but the MCP data surface itself must work locally.

Expected scale is one squad, one active release, up to 20 sprints per release, up to 100 features, up to 1000 stories, and up to 30 members.

## Constraints

- **Execution**: Runs locally on localhost - the app must not expose APIs or MCP externally by default.
- **Persistence**: Uses SQLite at `./data/squad-planner.db` - data should be easy to back up or move.
- **Stack**: Next.js, TypeScript, Prisma, Tailwind CSS, dnd-kit, and Node.js MCP - chosen for a simple full-stack local web app with a polished UI.
- **Capacity model**: Capacity is calculated in hours from members, working days, absences, holidays, meetings, and support, then normalized to 8-hour days.
- **Planning model**: Story points and estimated business days are independent; only estimated days consume sprint capacity.
- **Release model**: Only one release can be active at a time in v1.
- **Safety**: AI and MCP writes must be explicit; sensitive actions such as closing sprints or canceling items require confirmation or dangerous-operation marking.
- **UX priority**: Desktop is the priority; smaller screens may stack boards and use horizontal scrolling.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as a local web app | Keeps installation simple and avoids SaaS/security scope for v1. | - Pending |
| Use SQLite for local persistence | Portable, easy to back up, and enough for the expected data volume. | - Pending |
| Track capacity by estimated business days, not story points | Story points remain relative effort while days support capacity comparison. | - Pending |
| Permit over-capacity planning with visible warnings | Teams sometimes choose to overplan deliberately; the tool should expose risk, not block judgment. | - Pending |
| Move unfinished stories to the next sprint on close | Captures sprint leakage and preserves historical truth. | - Pending |
| Include MCP and AI in v1 | AI assistance is part of the product value, but must stay controlled and local. | - Pending |
| Use coarse MVP phases | User selected coarse planning; phases should deliver broad vertical slices. | - Pending |
| Use Prisma 7 with better-sqlite3 adapter | The local machine runs Node 24, and Prisma 7 is the supported line for that runtime. | - Accepted in Phase 1 |
| Prepare SQLite with a local sync script | Prisma schema validation and SQL generation worked, but schema-engine apply failed on this Windows/Node 24 host. | - Accepted in Phase 1 |
| Keep sprint assignment behind backlog planning preview | Direct story edits should not bypass capacity-impact context. | - Accepted in Phase 3 |
| Keep capacity placeholders pending in Phase 3 | Planned effort can use assigned story estimates now, while gross/net capacity remains Phase 4 scope. | - Accepted in Phase 3 |

## Evolution

PROJECT.md is a living project context document.

After each phase transition:
1. Move requirements that shipped and proved useful to Validated.
2. Move invalidated requirements to Out of Scope with the reason.
3. Add newly discovered active requirements when scope changes.
4. Record significant implementation or product decisions.
5. Check that What This Is and Core Value still describe the project.

After each milestone:
1. Review all sections.
2. Confirm the Core Value is still the right priority.
3. Audit Out of Scope items and keep the rationale current.
4. Update Context with the current state of the app, users, feedback, and risks.

---
*Last updated: 2026-06-03 after Phase 3 completion*
