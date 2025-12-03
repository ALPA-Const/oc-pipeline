# OC Pipeline - Stage 2 Dashboard

Production-ready React dashboard for OC Pipeline Phase 0.

## Features

- ✅ Authentication (Login/Signup)
- ✅ Project Selector
- ✅ KPI Cards (Budget, Schedule, Cost, Quality)
- ✅ Navigation (Header + Sidebar)
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ shadcn/ui components

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── ProjectSelector.tsx
│   │   ├── KPICard.tsx
│   │   └── KPICards.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── AppLayout.tsx
├── pages/
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── Dashboard.tsx
├── hooks/
│   ├── useAuth.tsx
│   └── useProjects.tsx
├── types/
│   └── index.ts
├── lib/
│   └── api.ts
├── App.tsx
└── main.tsx
```

## API Endpoints

The dashboard expects these backend endpoints:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /api/dashboard` - Dashboard KPI data
- `GET /api/projects` - Project list

## Authentication

The app uses JWT tokens stored in localStorage. Protected routes automatically redirect to login if not authenticated.

## Responsive Design

- Mobile: 375px (iPhone)
- Tablet: 768px (iPad)
- Desktop: 1440px (MacBook)

## Building for Production

```bash
npm run build
```

Output: `dist/` directory

## Deployment

Deploy the `dist/` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

## Next Steps

1. Connect to real backend API
2. Add more pages (Analytics, Admin, etc.)
3. Implement auto-refresh feature
4. Add performance monitoring
5. Add mobile swipe gestures

## Support

For issues or questions, contact the development team.
