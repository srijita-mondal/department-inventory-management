# Branching and contribution workflow

## Branches

- `main` — stable, tagged versions suitable for demos/releases.
- `develop` — integration branch where reviewed features are combined.
- `feature/<short-name>` — new capabilities.
- `fix/<short-name>` — non-urgent bug fixes.
- `release/<version>` — optional final testing and release notes.
- `hotfix/<short-name>` — urgent production fixes branched from `main`.

## Start a feature

```bash
git switch develop
git pull origin develop
git switch -c feature/student-notifications
# edit code, run tests
git add .
git commit -m "feat: add student due-date notifications"
git push -u origin feature/student-notifications
```

Open a pull request from the feature branch into `develop`. Request a review and ensure `pytest` passes before merging.

## Fix a bug

```bash
git switch develop
git pull origin develop
git switch -c fix/partial-return-stock
# reproduce and fix the bug
git add .
git commit -m "fix: preserve outstanding quantity on partial return"
git push -u origin fix/partial-return-stock
```

## Release

1. Create `release/0.2.0` from `develop`.
2. Freeze features; fix issues and update `CHANGELOG.md`.
3. Merge release into `main` and tag it: `git tag -a v0.2.0 -m "Release 0.2.0"`.
4. Merge the release branch back into `develop`.

## Branch protection recommendations for GitHub

On GitHub, protect `main` and `develop`: require pull requests, at least one review if the team size allows, passing tests, and no force pushes. Do not commit `.env`, passwords, database files, or real student data.

## Commit prefixes

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` tests
- `refactor:` code restructuring without behaviour change
- `chore:` maintenance
