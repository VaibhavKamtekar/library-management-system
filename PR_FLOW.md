# Pull Request Flow

Use this flow so all three team members can work in parallel without overwriting each other.

## Current shared base

Your dashboard work is already pushed on:

```bash
codex/charts-visualization
```

## Recommended next step

Open the first Pull Request:

```bash
codex/charts-visualization -> codex/integration-review
```

After that PR is reviewed and merged, `codex/integration-review` becomes the shared branch that everyone can safely build on.

## Friend workflow

Each friend should start from the latest integration branch:

```bash
git fetch origin
git checkout codex/integration-review
git pull origin codex/integration-review
```

Then create a personal feature branch:

```bash
git checkout -b codex/sports-feature-v2
```

or

```bash
git checkout -b codex/landing-design-v2
```

Use new branch names like `-v2` here so you do not inherit any old unfinished history from earlier local branches.

## PR targets

- Your charts work:
  `codex/charts-visualization -> codex/integration-review`
- Sports feature work:
  `codex/sports-feature-v2 -> codex/integration-review`
- Landing/design work:
  `codex/landing-design-v2 -> codex/integration-review`

## Daily team routine

Before starting work:

```bash
git fetch origin
git checkout codex/integration-review
git pull origin codex/integration-review
git checkout your-branch
git merge codex/integration-review
```

After finishing a task:

```bash
git add .
git commit -m "Describe the change"
git push -u origin your-branch
```

Then open a Pull Request into:

```bash
codex/integration-review
```

## Final release flow

After all three PRs are merged into `codex/integration-review` and tested together, open the final Pull Request:

```bash
codex/integration-review -> main
```

## Important rule

Do not open feature PRs directly into `main`.
