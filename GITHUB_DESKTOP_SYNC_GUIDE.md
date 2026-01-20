# GitHub Desktop Sync Guide

## How to Pull Projects from GitHub Desktop to Your Development Environment

This guide explains how to synchronize your work between GitHub Desktop and this repository environment.

---

## Prerequisites

- ✅ GitHub Desktop installed on your local machine
- ✅ GitHub account with access to `ALPA-Const/oc-pipeline` repository
- ✅ Git installed (comes with GitHub Desktop)

---

## Understanding the Workflow

When working with GitHub Desktop and this codebase, you're working with two different environments:

1. **Local Environment (GitHub Desktop)**: Your personal computer where you make changes
2. **Remote Repository (GitHub)**: The central repository at `https://github.com/ALPA-Const/oc-pipeline`
3. **Development Environment**: This current workspace

The workflow involves:
- Making changes in GitHub Desktop
- Pushing those changes to GitHub
- Pulling those changes into this development environment

---

## Method 1: Pull Changes Using Git Commands (Recommended)

### Step 1: Check Current Status

First, verify your current branch and any uncommitted changes:

```bash
cd /home/runner/work/oc-pipeline/oc-pipeline
git status
```

### Step 2: Commit Any Local Changes

If you have uncommitted changes, commit them first:

```bash
git add .
git commit -m "Your commit message"
```

### Step 3: Pull Latest Changes from GitHub

Pull the latest changes from the branch you're working on:

```bash
# Pull from the current branch
git pull origin <branch-name>

# For example, to pull from main:
git pull origin main

# To pull from a specific branch:
git pull origin copilot/pull-projects-from-github-desktop
```

### Step 4: Resolve Any Merge Conflicts (if necessary)

If there are conflicts:

```bash
# View conflicted files
git status

# After resolving conflicts in files:
git add .
git commit -m "Resolve merge conflicts"
```

---

## Method 2: Fetch and Merge (More Control)

This method gives you more control over the merge process:

```bash
# Step 1: Fetch all changes from GitHub
git fetch origin

# Step 2: See what branches are available
git branch -a

# Step 3: View differences before merging
git diff HEAD origin/<branch-name>

# Step 4: Merge the changes
git merge origin/<branch-name>
```

---

## Method 3: Pull Specific Branch Changes

If you've been working on a feature branch in GitHub Desktop:

```bash
# Step 1: See all available branches
git branch -a

# Step 2: Switch to the branch you want to update
git checkout <branch-name>

# Step 3: Pull the latest changes for that branch
git pull origin <branch-name>

# Step 4: Switch back to your working branch if needed
git checkout main
```

---

## Typical Workflows

### Workflow A: Syncing Main Branch

```bash
# 1. Make sure you're on main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Verify the pull was successful
git log --oneline -n 5
```

### Workflow B: Pulling Changes from a Feature Branch

```bash
# 1. Fetch all branches
git fetch origin

# 2. Switch to feature branch (or create it locally if it doesn't exist)
git checkout -b feature-branch origin/feature-branch

# 3. Pull latest changes
git pull origin feature-branch
```

### Workflow C: Merging GitHub Desktop Changes into Current Work

```bash
# 1. Commit your current work
git add .
git commit -m "Save current work"

# 2. Pull changes from GitHub
git pull origin main

# 3. If there are conflicts, resolve them
# 4. Continue working
```

---

## Working with GitHub Desktop Changes

### From GitHub Desktop to Here:

1. **In GitHub Desktop**:
   - Make your changes
   - Commit them with a descriptive message
   - Click "Push origin" or "Publish branch"

2. **In This Environment**:
   ```bash
   cd /home/runner/work/oc-pipeline/oc-pipeline
   git pull origin <branch-name>
   ```

3. **Verify Changes**:
   ```bash
   git log --oneline -n 5
   git status
   ```

---

## Checking What Will Be Pulled

Before pulling, you can preview what changes will be downloaded:

```bash
# Fetch without merging
git fetch origin

# See what's different
git diff HEAD origin/<branch-name>

# See commit history differences
git log HEAD..origin/<branch-name>

# See which files changed
git diff --name-only HEAD origin/<branch-name>
```

---

## Common Scenarios

### Scenario 1: "I made changes in GitHub Desktop and pushed them"

```bash
# Pull those changes here
git pull origin main
```

### Scenario 2: "I created a new branch in GitHub Desktop"

```bash
# Fetch all branches
git fetch origin

# List all branches to find yours
git branch -a

# Switch to the new branch
git checkout -b <new-branch-name> origin/<new-branch-name>
```

### Scenario 3: "I need to sync multiple branches"

```bash
# Fetch everything
git fetch --all

# Update main
git checkout main
git pull origin main

# Update another branch
git checkout feature-branch
git pull origin feature-branch
```

### Scenario 4: "I want to discard local changes and match GitHub exactly"

⚠️ **Warning**: This will delete any uncommitted local changes!

```bash
# Save branch name
git branch

# Reset to match remote exactly
git fetch origin
git reset --hard origin/<branch-name>

# Or for main branch:
git reset --hard origin/main
```

---

## Troubleshooting

### Issue: "fatal: refusing to merge unrelated histories"

This happens when trying to merge branches with no common history.

**Solution**:
```bash
git pull origin <branch-name> --allow-unrelated-histories
```

### Issue: "Your local changes would be overwritten by merge"

You have uncommitted changes that conflict with incoming changes.

**Solution**:
```bash
# Option 1: Commit your changes first
git add .
git commit -m "Save local changes"
git pull origin <branch-name>

# Option 2: Stash your changes temporarily
git stash
git pull origin <branch-name>
git stash pop
```

### Issue: "Permission denied (publickey)"

Authentication issue with GitHub.

**Solution**:
```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/ALPA-Const/oc-pipeline.git
git pull origin <branch-name>
```

### Issue: "Already up to date" but you know there are changes

Your local repository hasn't fetched the latest information.

**Solution**:
```bash
# Force fetch
git fetch origin --force

# Then pull
git pull origin <branch-name>
```

---

## Best Practices

1. **Always commit before pulling**: This makes it easier to undo if something goes wrong
   ```bash
   git add .
   git commit -m "WIP: Save current state"
   git pull origin main
   ```

2. **Pull frequently**: Regular small pulls are easier to manage than large ones
   ```bash
   # At the start of each work session
   git pull origin main
   ```

3. **Use feature branches**: Keep your work isolated
   ```bash
   git checkout -b feature/my-new-feature
   # Make changes
   git pull origin main  # Stay up to date with main
   ```

4. **Check status often**:
   ```bash
   git status
   git log --oneline -n 5
   ```

5. **Use descriptive commit messages**: Makes it easier to track changes
   ```bash
   git commit -m "Add user authentication feature"
   ```

---

## Verifying the Pull Was Successful

After pulling, verify everything worked:

```bash
# Check current status
git status

# View recent commits
git log --oneline -n 10

# See what changed in the last pull
git diff HEAD@{1} HEAD

# List changed files
git diff --name-status HEAD@{1} HEAD
```

---

## Quick Reference Commands

```bash
# Most common: Pull from current branch
git pull

# Pull from specific branch
git pull origin <branch-name>

# See all branches
git branch -a

# Switch branches
git checkout <branch-name>

# Check what will be pulled
git fetch origin
git diff HEAD origin/<branch-name>

# Undo last pull (if needed)
git reset --hard HEAD@{1}
```

---

## Integration with This Repository

This repository (`ALPA-Const/oc-pipeline`) is configured with:
- **Main Branch**: `main`
- **Current Branch**: `copilot/pull-projects-from-github-desktop`
- **Remote**: `origin` → `https://github.com/ALPA-Const/oc-pipeline`

To sync with your GitHub Desktop work:
1. Push from GitHub Desktop
2. Run `git pull origin <branch-name>` here
3. Continue development

---

## Additional Resources

- **GitHub Desktop Documentation**: https://docs.github.com/en/desktop
- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com/

---

## Need Help?

If you're stuck:
1. Check the troubleshooting section above
2. Run `git status` to see current state
3. Run `git log` to see recent history
4. Check GitHub repository directly: https://github.com/ALPA-Const/oc-pipeline

---

**Last Updated**: December 2025
**Repository**: ALPA-Const/oc-pipeline
