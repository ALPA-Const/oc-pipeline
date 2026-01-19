# OC Pipeline Backend API

Enterprise-grade backend server for the OC Pipeline construction management platform.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Deployment**: Railway

## Features

- ✅ RESTful API architecture
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Request validation
- ✅ Error handling middleware
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Request logging (Morgan)
- ✅ Response compression
- ✅ Health check endpoint

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── supabase.ts  # Supabase client setup
│   │   └── database.ts  # Database configuration
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/          # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── projectsRoutes.ts
│   │   ├── actionItemsRoutes.ts
│   │   ├── eventsRoutes.ts
│   │   └── dashboardRoutes.ts
│   ├── controllers/     # Request handlers
│   │   ├── authController.ts
│   │   ├── projectsController.ts
│   │   ├── actionItemsController.ts
│   │   ├── eventsController.ts
│   │   └── dashboardController.ts
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── railway.json
└── README.md
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_database_url

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Frontend Configuration
FRONTEND_URL=https://ocpipeline.vercel.app

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://ocpipeline.vercel.app,http://localhost:5173
```

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build
```

## Development

```bash
# Run in development mode with auto-reload
pnpm run dev
```

## Production

```bash
# Build and start
pnpm run build
pnpm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/google` - Google OAuth login

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Action Items
- `GET /api/action-items` - Get all action items
- `GET /api/action-items/:id` - Get action item by ID
- `POST /api/action-items` - Create new action item
- `PUT /api/action-items/:id` - Update action item
- `DELETE /api/action-items/:id` - Delete action item

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics and data

### Health Check
- `GET /health` - Server health status

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": [] // Optional validation details
}
```

## Deployment to Railway

1. Push code to GitHub repository
2. Connect Railway to your GitHub repository
3. Set environment variables in Railway dashboard
4. Railway will automatically build and deploy

### Railway Configuration

The `railway.json` file configures:
- Build command: `pnpm install && pnpm run build`
- Start command: `node dist/index.js`
- Restart policy: ON_FAILURE with max 10 retries

## Security Features

- **Helmet**: Sets security-related HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **JWT Authentication**: Secure token-based authentication
- **Request Validation**: Input validation using express-validator
- **Error Handling**: Centralized error handling
- **Rate Limiting**: (Recommended to add in production)

## Performance

- **Compression**: Gzip compression for responses
- **Connection Pooling**: Supabase connection pooling
- **Async/Await**: Non-blocking I/O operations

## Monitoring

- **Morgan Logging**: HTTP request logging
- **Health Check**: `/health` endpoint for monitoring
- **Error Logging**: Console error logging

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please contact the development team.