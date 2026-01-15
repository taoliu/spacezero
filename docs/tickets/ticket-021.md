# Ticket 021: GitHub Pages deployment (GitHub Actions)

## Context
We want a one-click deployment of the browser game to GitHub Pages for easy sharing and mobile testing.
The project uses Vite, so we must ensure `base` is correct when served from a repo subpath.

## Goal
Add a GitHub Actions workflow that builds the site and deploys to GitHub Pages on every push to main.

## Scope
Included:
- `.github/workflows/deploy-gh-pages.yml`
- Vite base path configuration for GitHub Pages
- Document required repository settings (Pages source: GitHub Actions)

Excluded:
- Custom domain
- Environment secrets beyond default GITHUB_TOKEN

## Tasks
1. Add GitHub Actions workflow using:
   - actions/checkout
   - actions/setup-node
   - install deps
   - build
   - actions/upload-pages-artifact
   - actions/deploy-pages

2. Configure Vite base path:
   - Use `/REPO_NAME/` in production (Pages)
   - Use `/` in dev
   - Prefer reading from env `GITHUB_REPOSITORY` or `BASE_PATH`

3. Add a short README note describing:
   - how to enable Pages (GitHub Actions)
   - deployed URL format

## Acceptance criteria
- Push to `main` triggers workflow.
- Workflow succeeds and publishes to GitHub Pages.
- Site loads correctly from `https://<user>.github.io/<repo>/` (assets resolve).
- Works on mobile browser.

## Testing notes
- Push a commit to main.
- Confirm Pages deployment completes.
- Open deployed URL and confirm the game renders and runs.

## Affected files (expected)
- `.github/workflows/deploy-gh-pages.yml`
- `vite.config.ts`
- `README.md` (small note)
