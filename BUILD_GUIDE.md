# Build Guide

This guide explains how to build and run the OC Pipeline project.

## Project Structure

The project uses a monorepo structure:

```
oc-pipeline/
├── frontend/           # React frontend application
│   ├── src/           # Frontend source code
│   ├── package.json   # Frontend dependencies
│   └── vite.config.ts # Vite configuration
├── backend/           # Express backend application  
├── src/               # Shared utilities and types
├── package.json       # Root dependencies (for tooling)
└── vite.config.ts     # Root Vite config (not used for frontend build)
```

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher (comes with Node.js)
- **Git**: For version control

Check your versions:
```bash
node --version    # Should be v18+
npm --version     # Should be v8+
```

## Installation

### Option 1: Install All Dependencies (Recommended)

Install dependencies for both root and frontend:

```bash
# Install root dependencies (development tools)
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Option 2: Frontend Only

If you only need to work on the frontend:

```bash
cd frontend
npm install
```

## Building the Frontend

The frontend is the main application and can be built independently.

### Development Build

Start the development server with hot reload:

```bash
cd frontend
npm run dev
```

The application will be available at: `http://localhost:5173`

### Production Build

Create an optimized production build:

```bash
cd frontend
npm run build
```

Build output will be in `frontend/dist/`:
- `dist/index.html` - Entry HTML file
- `dist/assets/` - Bundled JavaScript and CSS files

**Build Metrics** (as of January 2026):
- JavaScript bundle: ~787 KB (222 KB gzipped)
- CSS bundle: ~98 KB (16 KB gzipped)
- Build time: ~5 seconds

### Preview Production Build

Test the production build locally:

```bash
cd frontend
npm run preview
```

## Building the Backend

The backend is a separate Express application.

```bash
cd backend
npm install
npm run build    # If TypeScript compilation is configured
npm start        # Start the server
```

## Linting

Run ESLint to check code quality:

```bash
# Frontend
cd frontend
npm run lint

# Root (if configured)
npm run lint
```

## Common Issues

### Issue: "Cannot find module '/src/main.tsx'"

**Cause**: Running build from root directory instead of frontend directory.

**Solution**: Always run frontend commands from the `frontend/` directory:
```bash
cd frontend
npm run build
```

### Issue: "Module not found" errors

**Cause**: Dependencies not installed.

**Solution**: Install dependencies:
```bash
cd frontend
npm install
```

### Issue: Bundle size warning

**Cause**: JavaScript bundle exceeds 500 KB.

**Solution**: This is expected for the current codebase. To optimize:
1. Use dynamic imports for large components
2. Configure code splitting in `vite.config.ts`
3. Analyze bundle with `npm run build -- --mode analyze`

## Environment Variables

### Frontend

Create `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend

Create `.env` file in the `backend/` directory:

```env
PORT=3000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

See `.env.example` files in each directory for complete configuration options.

## Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build Command**: `cd frontend && npm install && npm run build`
2. **Output Directory**: `frontend/dist`
3. **Install Command**: `npm install`

### Backend Deployment (Railway/Render)

1. **Build Command**: `cd backend && npm install && npm run build`
2. **Start Command**: `cd backend && npm start`
3. **Port**: Will use `PORT` environment variable

## Testing

```bash
cd frontend
npm run test          # Run tests (if configured)
npm run test:coverage # Generate coverage report
```

## Continuous Integration

The project uses GitHub Actions for CI. See `.github/workflows/` for configuration.

To run CI checks locally:

```bash
# Lint check
cd frontend && npm run lint

# Build check  
cd frontend && npm run build

# Type check
cd frontend && npx tsc --noEmit
```

## Performance Tips

1. **Use Production Builds**: Development builds are much larger
2. **Enable Gzip**: Configure your server to compress assets
3. **Cache Dependencies**: Use `npm ci` instead of `npm install` in CI/CD
4. **Parallel Builds**: Build frontend and backend concurrently

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Getting Help

If you encounter issues:

1. Check this guide first
2. Review [SECURITY.md](./SECURITY.md) for security-related issues
3. Check [GitHub Issues](https://github.com/ALPA-Const/oc-pipeline/issues)
4. Contact the development team

## Recent Changes

- **2026-01-13**: Security vulnerabilities fixed in dependencies
- **2026-01-13**: Build guide created
- **2025-12-XX**: Project structure updated with monorepo layout
