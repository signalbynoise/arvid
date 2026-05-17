# Ship macOS Desktop App

Build, version-bump, and release the Electron macOS app to GitHub Releases.

## Steps

1. **Read current version** from `package.json`.
2. **Bump patch version** (e.g., `1.0.0` → `1.0.1`). If the user specifies a version (major/minor/patch or explicit like `2.0.0`), use that instead.
3. **Update `package.json`** with the new version.
4. **Build the `.dmg`**: run `npm run electron:build`. Wait for it to complete — this takes ~60 seconds.
5. **Verify the build output** exists at `release/Arvid-{version}-arm64.dmg`.
6. **Commit the version bump**: `git add package.json && git commit -m "Bump desktop app version to {version}"`.
7. **Push to main**: `git push origin main`. If rejected, `git pull --rebase origin main` first, then push again.
8. **Create GitHub release**: `gh release create v{version} release/Arvid-{version}-arm64.dmg --title "Arvid v{version}" --notes "..."`. Generate concise release notes based on changes since the last release tag.
9. **Update the download URL default** in `vite.config.site.ts` and `src/site/components/HeroSection.tsx` and `src/site/components/CtaSection.tsx` to point to the new `.dmg` filename if it changed.
10. If the download URL was updated, commit and push: `git add -A && git commit -m "Update desktop download URL to v{version}" && git push origin main`.
11. **Confirm** the release is live: `gh release view v{version}`.

**Rules:**
- Always push to `main`. Never create feature branches.
- Never use `--force` unless explicitly asked.
- The `release/` directory is gitignored — never commit `.dmg` files.
- If the build fails, report the error and stop. Do not create a release with a stale `.dmg`.
