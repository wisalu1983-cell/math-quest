---
name: version-lifecycle-manager
description: MathQuest project skill for opening a new version, closing a version, switching the version axis, or checking/rebuilding Plan/vX.Y version management packages. Trigger on: 开新版本, 新建版本, 版本收口, 切版本轴, 版本管理文档, 00-04, Plan/vX.Y, version package.
---

# Version Lifecycle Manager

Use this skill only for MathQuest version lifecycle work:

- opening a new `vX.Y`
- closing a version
- switching the current / previous version axis
- checking or rebuilding a `ProjectManager/Plan/vX.Y/` management package
- investigating missing `README + 00 + 01 + 02 + 03 + 04 + phases` docs

## Source Of Truth

Read these project docs in order:

1. `ProjectManager/Overview.md`
2. `ProjectManager/Plan/version-lifecycle.md`
3. For new versions: `ProjectManager/Plan/templates/version-package-template.md`
4. For ordinary subplans: `ProjectManager/Plan/templates/plan-template.md`

Do not copy lifecycle rules into the skill. `ProjectManager` remains the rule source; this skill is the trigger and workflow guardrail.

## Required Workflow

1. Identify the version, e.g. `v0.4`.
2. Run the package check:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .agents/skills/version-lifecycle-manager/scripts/check-version-package.ps1 -Version v0.4
   ```
3. If opening a new version, scaffold manually from `ProjectManager/Plan/templates/version-package-template.md`.
4. Ensure the version package has:
   - `README.md`
   - `00-overview.md`
   - `01-*.md`
   - `02-classification.md`
   - `03-phase-plan.md`
   - `04-execution-discipline.md`
   - `phases/`
   - at least one `phases/phase-N.md`
5. If a required item does not apply, write `N/A` and the reason in the version README. Never silently omit it.
6. Update indexes and active control plane as needed:
   - `ProjectManager/Plan/README.md`
   - `ProjectManager/Overview.md`
   - `ProjectManager/Specs/_index.md` if new specs were added
   - `ProjectManager/ISSUE_LIST.md` / `ProjectManager/Backlog.md` if issue lifecycle changed
7. Run:
   ```powershell
   npx tsx scripts/pm-sync-check.ts
   ```

## Cross-Tool Canonical Location

Canonical skill source:

`E:/Projects/MathQuest/.agents/skills/version-lifecycle-manager/SKILL.md`

Claude Code / Cursor adapters should point here instead of maintaining copied instructions.
