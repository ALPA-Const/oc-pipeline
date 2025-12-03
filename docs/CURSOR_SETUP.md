# Cursor IDE Setup Guide for OC-Pipeline

This guide walks you through setting up Cursor IDE for optimal development on the OC-Pipeline construction management system.

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Repository Configuration](#repository-configuration)
3. [Cursor Settings](#cursor-settings)
4. [Cloud Agents](#cloud-agents)
5. [GitHub Integration](#github-integration)
6. [BugBot Setup](#bugbot-setup)
7. [Recommended Extensions](#recommended-extensions)

---

## Initial Setup

### 1. Open the Project
```bash
# Clone from GitHub (if not already done)
git clone https://github.com/YOUR_ORG/oc-pipeline.git
cd oc-pipeline

# Open in Cursor
cursor .
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 3. Environment Variables
Create `.env` files based on the examples:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

---

## Repository Configuration

### Files Created for Cursor

| File | Purpose |
|------|---------|
| `.cursorrules` | Global project rules and context for AI |
| `.cursorignore` | Files to exclude from AI indexing |
| `.cursor/rules/*.mdc` | Domain-specific context files |

### .cursorrules
Contains:
- Project overview and architecture
- Tech stack details
- Coding conventions
- Common development patterns

### .cursorignore
Excludes from indexing:
- `node_modules/` - Dependencies
- `dist/`, `build/` - Build outputs
- `*.lock` files - Package locks
- Binary files (images, PDFs)
- Environment files (security)

### .cursor/rules/ (MDC Files)
Domain-specific context that Cursor loads on-demand:

| File | When Used |
|------|-----------|
| `project-setup.mdc` | Always loaded - dev environment |
| `analytics-algorithms.mdc` | Working on metrics/analytics |
| `data-flow-architecture.mdc` | Working on state/data flow |
| `metrics-engine.mdc` | Working on KPIs/calculations |
| `pipeline-workflow-model.mdc` | Working on pipeline stages |

---

## Cursor Settings

### Recommended Settings (settings.json)

Open Cursor Settings (`Ctrl+,` or `Cmd+,`) and configure:

```json
{
  "cursor.cpp.disabledLanguages": [],
  "cursor.general.enableShadowWorkspace": true,
  "cursor.chat.defaultModel": "claude-sonnet-4-20250514",
  "cursor.composer.defaultModel": "claude-sonnet-4-20250514",

  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.suggest.autoImports": true,

  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

### AI Model Preferences

For this project, recommended models:
- **Chat**: Claude Sonnet 4 (best for code understanding)
- **Composer**: Claude Sonnet 4 (best for multi-file edits)
- **Autocomplete**: Default (fast suggestions)

---

## Cloud Agents

### Setting Up Background Agents

1. **Open Settings** → **Features** → **Background Agent**
2. Enable "Allow background agents"
3. Configure agent permissions:
   - ✅ Read files
   - ✅ Write files
   - ✅ Run terminal commands
   - ⚠️ Review before executing destructive commands

### Agent Use Cases for This Project

| Task | Agent Capability |
|------|-----------------|
| "Add a new KPI card" | Creates component, updates imports |
| "Fix TypeScript errors" | Analyzes and fixes type issues |
| "Update API endpoint" | Modifies controller, route, and frontend |
| "Refactor component" | Multi-file refactoring |

---

## GitHub Integration

### 1. Connect GitHub Account

1. Open Cursor Settings
2. Go to **Accounts** → **GitHub**
3. Click **Sign in with GitHub**
4. Authorize Cursor

### 2. Repository Settings

Once connected:
- Pull/Push directly from Cursor
- View PR comments inline
- Use GitHub Copilot alongside Cursor AI

### 3. Branch Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes with Cursor AI assistance

# Commit with conventional commits
git commit -m "feat(dashboard): add new KPI card for win rate"

# Push and create PR
git push -u origin feature/your-feature
```

### Commit Message Convention
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: dashboard, pipeline, auth, api, ui
```

---

## BugBot Setup

### What is BugBot?
Cursor's BugBot automatically detects and suggests fixes for:
- TypeScript errors
- ESLint violations
- Runtime exceptions
- Logic errors

### Enable BugBot

1. Open Settings → **Features**
2. Enable **BugBot**
3. Configure detection level:
   - **Aggressive**: All potential issues
   - **Balanced**: High-confidence issues (recommended)
   - **Conservative**: Only definite bugs

### BugBot for This Project

Common issues BugBot catches:
- Missing null checks on Supabase responses
- Incorrect TypeScript types
- Unused imports
- Missing dependencies in useEffect

---

## Recommended Extensions

### Essential
```
# Install via Cursor Extensions panel
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
```

### Helpful
```
- GitLens
- Error Lens
- Auto Rename Tag
- Bracket Pair Colorizer
```

### Project-Specific
```
- Prisma (for backend)
- PostCSS Language Support
- DotENV
```

---

## Quick Reference

### Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Open AI Chat | `Ctrl+L` | `Cmd+L` |
| Inline Edit | `Ctrl+K` | `Cmd+K` |
| Composer | `Ctrl+I` | `Cmd+I` |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Terminal | `` Ctrl+` `` | `` Cmd+` `` |

### Common AI Prompts for This Project

```
"Explain how the pipeline stage transitions work"
"Add a new filter to the dashboard KPI cards"
"Create a service function to fetch projects by stage"
"Fix the TypeScript error in this component"
"Refactor this component to use React Query"
```

---

## Troubleshooting

### AI Not Understanding Context
1. Check `.cursorrules` is present
2. Verify `.cursorignore` isn't excluding needed files
3. Try: "Read the .cursorrules file first, then..."

### Slow Indexing
1. Check `.cursorignore` excludes `node_modules`
2. Close unused files
3. Restart Cursor

### GitHub Connection Issues
1. Sign out and sign back in
2. Check GitHub permissions
3. Verify SSH keys are configured

---

## Next Steps

1. ✅ Open project in Cursor
2. ✅ Review `.cursorrules` for project context
3. ✅ Install recommended extensions
4. ✅ Configure settings
5. ✅ Connect GitHub account
6. 🚀 Start developing!

---

*Last updated: November 2024*

