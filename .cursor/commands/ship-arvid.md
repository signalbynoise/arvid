# Ship to Main

Ship ALL changes in the working tree directly to `main`. No branches, no PRs.

## Git

**Ship every pending change — staged, unstaged, and untracked — regardless of which agent, session, or manual edit created them.**

1. Run `git status` and `git diff --stat` to see the full picture.
2. Analyze **all** changes and write a clear, concise commit message in imperative mood (e.g., "Add team and project settings modals"). If changes span multiple concerns, summarize the overall intent.
3. Stage everything: `git add -A`.
4. Commit with the message.
5. Push directly to main: `git push origin main`. If rejected, `git pull --rebase origin main` first, then push again.
6. Show `git log --oneline -1` to confirm.

**Rules:**
- Always push to `main`. Never create feature branches.
- Never create pull requests.
- Never use `--force` unless explicitly asked.

## Monitor Deploy

After pushing, monitor the Render deploy to confirm it succeeds.

Using Render MCP tools (`user-render` or `plugin-render-render`):

1. Select the **Arvid** workspace: `select_workspace(ownerID: "tea-d7rm1iosfn5c73cdpqrg")`. No need to ask — always use this workspace.
2. Identify the services from `render.yaml` or by listing services.
3. Poll `list_deploys(serviceId, limit: 1)` until the latest deploy matches the pushed commit.
4. Watch for the deploy status to reach `live` or `build_failed`.
5. If `live` — report success with deploy time.
6. If `build_failed` — pull the build logs via `list_logs(resource, type: ["build"], limit: 50)` and report the failure with the error output.
7. If the deploy hasn't appeared after 60 seconds, check `list_logs(resource, type: ["build"], limit: 20)` for early build output.
