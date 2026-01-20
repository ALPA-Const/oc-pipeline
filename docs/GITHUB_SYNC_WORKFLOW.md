# GitHub Desktop Sync Workflow

## Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Desktop Workflow                       │
└─────────────────────────────────────────────────────────────────┘

Step 1: Make Changes Locally (GitHub Desktop)
┌────────────────────┐
│  Your Computer     │
│  (GitHub Desktop)  │
│                    │
│  • Edit files      │
│  • Test locally    │
│  • Commit changes  │
└──────┬─────────────┘
       │
       │ Push
       ▼
Step 2: Push to Remote Repository
┌────────────────────┐
│     GitHub.com     │
│                    │
│  ALPA-Const/       │
│  oc-pipeline       │
│                    │
│  Remote Repository │
└──────┬─────────────┘
       │
       │ Pull
       ▼
Step 3: Sync to Development Environment
┌────────────────────┐
│  Dev Environment   │
│                    │
│  git pull origin   │
│  <branch-name>     │
│                    │
│  ✓ Up to date      │
└────────────────────┘
```

## Command Flow

### From GitHub Desktop to Dev Environment

```bash
# GitHub Desktop Actions (GUI)
1. Make changes in files
2. Stage changes (check files)
3. Write commit message
4. Click "Commit to main"
5. Click "Push origin"

# In Development Environment (Terminal)
git pull origin main
# or
git pull origin <your-branch-name>
```

## Practical Example

### Scenario: You edited 3 files in GitHub Desktop

**In GitHub Desktop:**
```
1. You edited:
   - src/components/Dashboard.tsx
   - src/services/api.service.ts  
   - README.md

2. Commit message: "Update dashboard components"

3. Click "Push origin"
```

**In Development Environment:**
```bash
# Navigate to repo
cd /home/runner/work/oc-pipeline/oc-pipeline

# Check status before pulling
git status

# Pull the changes
git pull origin main

# Verify the changes arrived
git log --oneline -n 3

# Check which files changed
git diff HEAD~1 HEAD --name-only
```

**Result:**
```
From https://github.com/ALPA-Const/oc-pipeline
 * branch            main       -> FETCH_HEAD
Updating abc1234..def5678
Fast-forward
 src/components/Dashboard.tsx    | 45 +++++++++++++++---------
 src/services/api.service.ts     | 12 +++++++
 README.md                       |  8 +++--
 3 files changed, 48 insertions(+), 17 deletions(-)
```

## Branching Workflow

### Working on a Feature Branch

**In GitHub Desktop:**
```
1. Current Branch: main
2. Create new branch: feature/new-dashboard
3. Make changes
4. Commit changes
5. Publish branch (push to GitHub)
```

**In Development Environment:**
```bash
# Fetch all branches
git fetch origin

# See available branches
git branch -a

# Switch to the feature branch
git checkout -b feature/new-dashboard origin/feature/new-dashboard

# Or if branch exists locally
git checkout feature/new-dashboard
git pull origin feature/new-dashboard
```

## Sync Multiple Branches

```bash
# Get all updates from GitHub
git fetch --all

# Update main branch
git checkout main
git pull origin main

# Update feature branch
git checkout feature/my-feature
git pull origin feature/my-feature

# See all branches and their status
git branch -vv
```

## Common Patterns

### Pattern 1: Daily Sync
```bash
# Start of day - get latest code
git checkout main
git pull origin main

# Create/switch to your branch
git checkout -b feature/my-work
# Work on your changes...

# End of day - push in GitHub Desktop
# Next day - pull updates
git checkout main
git pull origin main
git checkout feature/my-work
git merge main  # Merge latest changes into your branch
```

### Pattern 2: Before Starting Work
```bash
# Always start with latest code
git status                    # Check for uncommitted changes
git stash                     # Save any uncommitted work
git pull origin main          # Get latest changes
git stash pop                 # Restore your uncommitted work
```

### Pattern 3: After GitHub Desktop Push
```bash
# You pushed in GitHub Desktop, now sync here
git fetch origin              # Get latest refs
git log HEAD..origin/main     # See what's new
git pull origin main          # Bring in changes
```

## Status Checks

### Before Pulling
```bash
# What branch am I on?
git branch

# Any uncommitted changes?
git status

# What's on the remote that I don't have?
git fetch origin
git log HEAD..origin/main --oneline
```

### After Pulling
```bash
# Did it work?
git status

# What just changed?
git log --oneline -n 5

# Show file changes
git diff HEAD~1 HEAD --stat
```

## Troubleshooting Workflow

```
Problem: "Already up to date" but you know there are changes
│
├─► Solution 1: Force fetch
│   git fetch origin --force
│   git pull origin main
│
├─► Solution 2: Check branch
│   git branch -a
│   # Make sure you're pulling from correct branch
│
└─► Solution 3: Check remote
    git remote -v
    # Verify it points to correct repository
```

```
Problem: "Your local changes would be overwritten"
│
├─► Solution 1: Stash changes
│   git stash
│   git pull origin main
│   git stash pop
│
├─► Solution 2: Commit changes
│   git add .
│   git commit -m "WIP: Save local work"
│   git pull origin main
│
└─► Solution 3: Reset (CAUTION: loses changes)
    git reset --hard origin/main
```

## Integration with GitHub Desktop

### Typical Development Cycle

```
Day 1:
  GitHub Desktop:     Edit → Commit → Push
  Dev Environment:    git pull origin main

Day 2:
  Dev Environment:    git pull origin main (get yesterday's work)
  GitHub Desktop:     Edit → Commit → Push
  Dev Environment:    git pull origin main (sync new changes)

Day 3:
  GitHub Desktop:     Edit → Commit → Push
  Dev Environment:    git pull origin main
  Deploy to staging
```

## Quick Reference

| Action | GitHub Desktop | Development Environment |
|--------|----------------|------------------------|
| Get latest code | Fetch origin button | `git pull origin main` |
| See changes | Changes tab | `git status` |
| View history | History tab | `git log --oneline` |
| Switch branch | Branch dropdown | `git checkout <branch>` |
| Create branch | New branch button | `git checkout -b <name>` |

## Key Concepts

1. **Push** (GitHub Desktop → GitHub): Upload your changes to the cloud
2. **Pull** (GitHub → Dev Env): Download changes to your workspace  
3. **Fetch**: Get information about changes without merging
4. **Merge**: Combine changes from different sources
5. **Branch**: Independent line of development
6. **Commit**: Snapshot of your changes

## Best Practices

✅ **DO**:
- Pull before starting work each day
- Commit frequently with clear messages
- Push at the end of each work session
- Keep branches up to date with main

❌ **DON'T**:
- Work with uncommitted changes when pulling
- Force push (can lose work)
- Ignore merge conflicts
- Work on main branch directly (use feature branches)

---

## More Information

- **Quick Commands**: [QUICK_START_GIT_SYNC.md](../QUICK_START_GIT_SYNC.md)
- **Full Guide**: [GITHUB_DESKTOP_SYNC_GUIDE.md](../GITHUB_DESKTOP_SYNC_GUIDE.md)
- **Repository**: https://github.com/ALPA-Const/oc-pipeline

---

*Last Updated: December 2025*
