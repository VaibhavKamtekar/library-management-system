# Collaboration Workflow

This repository should use `main` as the stable branch.

## Team branches

- `codex/charts-visualization` for chart and visualization work
- `codex/sports-feature` for the sports feature
- `codex/landing-design` for landing page animation and design work
- `codex/integration-review` for combining and testing the changes you want to keep before merging to `main`

## Daily workflow

Before starting new work, update your local `main` branch:

```bash
git checkout main
git pull origin main
```

Then switch to your assigned branch:

```bash
git checkout codex/charts-visualization
```

Replace the branch name as needed for each person.

## Saving your work

Commit small working chunks and push often:

```bash
git add .
git commit -m "Add charts for admin dashboard"
git push -u origin codex/charts-visualization
```

## Bringing in the latest main changes

Regularly update your feature branch with the latest `main` branch:

```bash
git checkout main
git pull origin main
git checkout codex/charts-visualization
git merge main
```

Resolve any merge conflicts, test the app, then commit the merge if Git asks for it.

## Combining selected work

When you want to review changes together, use the integration branch:

```bash
git checkout codex/integration-review
git merge codex/charts-visualization
git merge codex/sports-feature
git merge codex/landing-design
```

If you want only specific commits instead of the full branch:

```bash
git cherry-pick <commit-id>
```

If you want only one file from another branch:

```bash
git checkout codex/landing-design -- frontend/src/App.js
```

## Final merge to main

After testing the integration branch:

```bash
git checkout main
git pull origin main
git merge codex/integration-review
git push origin main
```

## Important team rule

Do not commit directly to `main`. Everyone should work only on their assigned branch and merge reviewed changes later.
