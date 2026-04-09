# Arcigy Application Agent Notes

## Repository

- Repository: `arcigy/application`
- Always keep changes scoped to this repository.
- When a task is finished, push the final branch to `origin` in this repo unless the user explicitly says not to.

## Product Goal

Arcigy is a custom automation platform for different entrepreneurs and businesses.

- The app is used to deliver automation workspaces to individual users.
- Automations are not generic.
- Each automation is custom-built for a specific customer or business case.
- A single automation will usually belong to one user or one client only.
- The interface can differ per user because each user may have a different set of automations and workflow needs.

## Core Product Rules

- Do not design the system as a generic automation marketplace.
- Do not assume one shared automation model for all users.
- Prefer customer-specific workflows, UI states, and data structures.
- Keep the implementation flexible enough that different users can have completely different automation modules.

## Database Approach

The project should avoid creating a separate table for every small automation variation.

- The database is designed to stay flexible by storing automation-specific payloads as JSON.
- Use JSON / JSONB-style storage for data that differs between automations.
- The `data` area of the system is meant to hold full JSON objects for automation records.
- Keep relational tables only for shared entities, control flags, logs, users, and other stable platform-level concepts.
- Use structured columns only where the data is common across most automations.
- If a new automation needs unique fields, prefer storing those fields inside JSON instead of creating a new wide table.

## Architecture Expectations

- The app is a Next.js application with automation handlers, API routes, and user dashboards.
- Backend automation logic lives under `src/automation-system`.
- UI routes live under `src/app`.
- Shared auth helpers live under `src/lib`.
- Treat automation handlers as customer-specific business logic, not reusable generic templates unless the reuse is truly stable.

## Development Rules

- Preserve the custom nature of automations.
- Avoid refactors that flatten or standardize away customer-specific differences.
- When editing env handling, database access, or automation handlers, be careful not to force build-time validation of runtime-only secrets.
- Prefer changes that keep `next build` working in environments where secrets are injected only at runtime.

## Operational Notes

- If you add new automation data, think first about whether it belongs in a JSON payload rather than a new table.
- If a task requires publishing code, commit intentionally and push the branch to `arcigy/application`.
- Keep implementation notes practical and specific to this repo rather than generic Next.js advice.
