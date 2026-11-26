# MovieExplorer repository instructions

**Version 1 · 2026-11-26**

These instructions apply to development assistance throughout this repository. The project owner defines the scope and manages Git and deployment.

## Before making changes

1. Read this file, [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md), and [ARCHITECTURE.md](ARCHITECTURE.md).
2. Inspect the relevant source, configuration, and existing behavior. Treat the current implementation sections as the recorded baseline and check the source for changes.
3. Identify the requested phase, its deliverables, and any scope restrictions. Identify likely regressions in existing routes, discovery, search, favorites, visual layout, or deployment.
4. Work incrementally. Preserve working functionality and existing user data. Keep edits scoped to the approved phase. Avoid unrelated features, dependencies, decorative changes, rewrites, and cleanup.

Proposals in the design and architecture references require a later authorized task before implementation. If source and documentation differ, verify the behavior and report the discrepancy. Update the relevant document when an approved change makes the baseline stale.

## Git and deployment ownership

The project owner exclusively manages Git operations unless they explicitly authorize the specific operation in the current task. This restriction applies to read and write operations, direct commands, tools and scripts that invoke Git. It includes `git status`, `git diff`, `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git switch`, `git merge`, `git rebase`, `git reset`, and branch creation or deletion.

Use direct filesystem inspection for file checks within scope. Automatic deployment is prohibited. The existing `npm run deploy` script publishes and must never be used as a verification step. After implementation, list changed files and provide any relevant suggested Git commands as text for the owner to run.

## Design and accessibility

- Follow [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Preserve the green and navy visual identity, poster-focused discovery, and existing visual hierarchy.
- Reuse card, layout and interaction patterns across movies and TV where appropriate. Make visual changes only within the approved task.
- Check representative responsive widths and affected states. Treat keyboard access, focus visibility, contrast, accessible control names and user feedback as functional requirements.
- Address documented layout or accessibility defects when in scope. Update the design document after approved visual changes and record significant decisions and reasons.

## Architecture and compatibility

- Follow [ARCHITECTURE.md](ARCHITECTURE.md). Retain Vue, Vite, Tailwind and Pinia unless the owner explicitly instructs otherwise. Prefer existing patterns and dependencies where they satisfy the task.
- Keep request and persistence logic separate from presentation. Validate external data and user-entered request parameters at the relevant boundaries.
- In changed asynchronous flows, distinguish loading, populated success, empty success and error. Prevent obsolete responses from replacing newer results.
- Preserve existing routes and link semantics unless the owner approves a migration. Verify direct navigation and refresh when routes or hosting behavior change.
- Preserve the data and user behavior behind `favoritesList`. For an approved media expansion, test legacy movie records, duplicate entries, and same-number movie and TV IDs. Prefer retry-safe migration and preserve recoverability after a partial failure.
- Database, authentication and account infrastructure require explicit approval.

## Security and privacy

- Keep credentials confidential. Never print environment variable values, credential-bearing URLs, tokens, authorization headers or private user storage contents. Refer to environment variable names only.
- Keep new secrets out of client bundles, public assets, logs, documentation and test fixtures. Architecture records the historical TMDB key exposure and the current server-only integration.
- Validate API inputs and allowlist any approved server-side proxy endpoints and parameters. Unrestricted proxying is prohibited.
- Protect user data during migrations. Report security concerns with evidence and impact while keeping sensitive values out of the report.

## Verification

Once testing infrastructure exists, run the relevant automated checks within the requested phase. Verify affected behavior and likely regressions. Use representative cases, including loading, empty, error, retry and slow request ordering. When relevant, check responsive layouts and keyboard use, direct routes and page refresh, movie/TV ID collisions, favorite persistence, and migration failure/retry safety.

Use read-only checks for documentation-only phases where the task restricts builds or generated files. Report the commands or verification performed and their actual outcomes. If a check cannot run, state the reason and what remains unverified. Test reports must distinguish completed work from manual checks still needed.

## End-of-task report for implementation work

1. Summary of work completed.
2. Files created.
3. Files modified.
4. Files removed, if any.
5. Technical decisions and reasons.
6. Tests or checks performed.
7. Actual test results, including failures or skipped checks and their reasons.
8. Existing functionality preserved.
9. Remaining issues.
10. Potential regressions or limitations.
11. Manual verification steps still applicable.
12. Documentation updates.
13. Whether any Git commands or deployment operations were executed. Include any suggested commands as text only unless separately authorized.
