# Quick Start: Syncing with GitHub Desktop

## TL;DR - Just Want to Pull Changes?

```bash
cd /home/runner/work/oc-pipeline/oc-pipeline
git pull origin main
```

---

## Common Commands

### Pull Latest Changes
```bash
# From main branch
git pull origin main

# From specific branch
git pull origin <branch-name>

# From current branch
git pull
```

### Check What's New Before Pulling
```bash
git fetch origin
git diff HEAD origin/main
```

### See All Available Branches
```bash
git branch -a
```

### Switch to a Different Branch
```bash
git checkout <branch-name>
```

---

## Typical Workflow

1. **Start Your Session**
   ```bash
   git status
   git pull origin main
   ```

2. **Make Changes in GitHub Desktop**
   - Edit files
   - Commit
   - Push to GitHub

3. **Pull Those Changes Here**
   ```bash
   git pull origin main
   ```

4. **Verify**
   ```bash
   git log --oneline -n 5
   ```

---

## Troubleshooting

### "Your local changes would be overwritten"
```bash
git stash
git pull origin main
git stash pop
```

### "Already up to date" but changes exist
```bash
git fetch origin --force
git pull origin main
```

### See Uncommitted Changes
```bash
git status
git diff
```

---

## Need More Details?

See the full guide: [GITHUB_DESKTOP_SYNC_GUIDE.md](./GITHUB_DESKTOP_SYNC_GUIDE.md)

---

**Current Repository**: `ALPA-Const/oc-pipeline`  
**Main Branch**: `main`  
**Remote URL**: `https://github.com/ALPA-Const/oc-pipeline`
