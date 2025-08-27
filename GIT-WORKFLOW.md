# 🌿 Git Workflow & Branch Management Strategy

## 📊 Current Implementation

### Automated Quality & Git Management

When you run `cx build TASK-XXX`, the system automatically:

1. **Quality Checks** (Auto-fix enabled):
   - ✅ Code Linting (ESLint) - Auto-fixes issues
   - ✅ Code Formatting (Prettier) - Auto-fixes formatting
   - ⚠️ Security Audit - Warns but doesn't block
   - ⚠️ Unit Tests - Warns but doesn't block

2. **Git Workflow**:
   - 📦 Stashes any uncommitted changes
   - 🔄 Switches to main branch
   - ⬇️ Pulls latest changes from origin
   - 🌿 Creates new branch: `task/task-xxx`
   - 📝 Updates task status to "in-progress"

## 🎯 Branch Strategy

### Branch Types

```
main
├── task/task-001     # Individual task branches
├── task/task-002
├── feature/epic-name # Feature branches for epics
├── hotfix/issue-123  # Emergency fixes
└── release/v1.0.0    # Release preparation
```

### Naming Convention

| Branch Type | Pattern               | Example               |
| ----------- | --------------------- | --------------------- |
| Task        | `task/task-xxx`       | `task/task-001`       |
| Feature     | `feature/description` | `feature/auth-system` |
| Hotfix      | `hotfix/issue-xxx`    | `hotfix/issue-123`    |
| Release     | `release/vX.Y.Z`      | `release/v1.0.0`      |

## 🔄 Workflow Steps

### 1. Starting a Task

```bash
# Automatic with quality checks
cx build TASK-001

# What happens behind the scenes:
# 1. Runs linting (auto-fixes if possible)
# 2. Runs formatting (auto-fixes)
# 3. Runs security audit
# 4. Runs tests
# 5. Stashes changes
# 6. Creates branch task/task-001
# 7. Updates task status
```

### 2. During Development

```bash
# Track progress
cx update TASK-001 --progress 50

# Commit frequently with descriptive messages
git add .
git commit -m "feat: Add user authentication middleware

- Implement JWT token validation
- Add role-based access control
- Create auth middleware tests"

# Push to remote
git push -u origin task/task-001
```

### 3. Completing a Task

```bash
# Mark as complete
cx complete TASK-001

# Create pull request
gh pr create --title "feat: [TASK-001] User authentication" \
  --body "## Summary
  Implements user authentication with JWT

  ## Changes
  - Auth middleware
  - Role-based access
  - Unit tests

  ## Testing
  - All tests passing
  - Security audit clean"
```

### 4. Code Review Process

```bash
# Review PR
gh pr review 123 --approve
gh pr review 123 --request-changes
gh pr review 123 --comment

# Merge when approved
gh pr merge 123 --squash --delete-branch
```

## 🚦 Commit Message Convention

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```bash
# Feature
git commit -m "feat(auth): Add OAuth2 integration"

# Bug fix
git commit -m "fix(api): Resolve null pointer in user endpoint"

# Documentation
git commit -m "docs: Update API documentation"
```

## 🔐 Protected Branch Rules

### Main Branch Protection

- ✅ Require pull request reviews (min 1)
- ✅ Dismiss stale reviews
- ✅ Require status checks (CI/CD)
- ✅ Require branches to be up to date
- ✅ Include administrators
- 🚫 No force pushes
- 🚫 No deletions

## 📋 Git Hooks (Automated)

### Pre-commit

- Runs ESLint
- Runs Prettier
- Checks for secrets

### Pre-push

- Runs full test suite
- Runs security audit
- Checks test coverage

## 🎯 Best Practices

### DO's ✅

- Create branch per task
- Commit early and often
- Write descriptive commit messages
- Keep PRs small and focused
- Rebase before merging
- Delete branches after merge
- Tag releases

### DON'Ts ❌

- Don't commit directly to main
- Don't force push to shared branches
- Don't commit sensitive data
- Don't merge without review
- Don't leave branches stale
- Don't mix features in one branch

## 🚀 Quick Commands

```bash
# Start new task with quality checks
cx build TASK-001

# Check current branch
git branch --show-current

# Update from main
git fetch origin main
git rebase origin/main

# Interactive rebase (clean history)
git rebase -i HEAD~3

# Stash changes
git stash save "WIP: Feature description"

# Create PR
gh pr create

# View PR status
gh pr status

# Clean up local branches
git branch --merged | grep -v main | xargs git branch -d
```

## 📊 Git Status in Dashboard

The creaite dashboard shows:

- Current branch
- Uncommitted changes
- Behind/ahead of origin
- Active PRs
- Recent commits

Run `cx dashboard` to see git status integrated with task management.

## 🔄 Continuous Integration

Every push triggers:

1. **Quality Checks**: Linting, formatting
2. **Security**: Dependency audit, SAST scan
3. **Testing**: Unit tests, coverage check
4. **Build**: Compilation check

## 💡 Tips

1. **Use task branches**: Keeps work isolated
2. **Commit atomically**: One logical change per commit
3. **Review thoroughly**: Quality > Speed
4. **Document changes**: Update README/docs
5. **Test locally**: Run `cx test` before pushing
6. **Security first**: Run `cx security` regularly

---

_Generated with CREAITE framework - where ai meets productivity_
