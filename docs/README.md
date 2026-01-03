# OC Pipeline Backend

**ATLAS-Powered Legal Practice Management System**

A comprehensive backend API for legal practice management, featuring 16 specialized modules and an intelligent agentic infrastructure (ATLAS) for automation and AI-powered workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 15** (via Supabase)
- **npm** or **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/oc-pipeline-backend.git
cd oc-pipeline-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your .env file with Supabase credentials
# See docs/DEPLOYMENT.md for details

# Run database migrations (in Supabase SQL Editor)
# Execute files in database/migrations/ in order

# Start development server
npm run dev
```

The API will be available at `http://localhost:10000`

### Verify Installation

```bash
# Health check
curl http://localhost:10000/health

# Detailed health (includes database status)
curl http://localhost:10000/health/detailed
```

---

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[API Documentation](docs/API.md)** - Comprehensive API reference
- **[Database Schema](database/README.md)** - Database structure and migrations

---

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 20 with ES Modules
- **Framework**: Express.js
- **Database**: PostgreSQL 15 (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **ORM**: Direct SQL with pg driver
- **Logging**: Winston
- **Validation**: Joi
- **Testing**: Jest (planned)

### Project Structure

```
oc-pipeline-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API route definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   │   ├── ai/          # ATLAS agentic services
│   │   └── modules/     # Module-specific services
│   ├── utils/           # Utility functions
│   └── server.js        # Application entry point
├── database/
│   ├── migrations/      # SQL migration files
│   └── README.md        # Database documentation
├── docs/                # Documentation
├── tests/               # Test suites (planned)
└── package.json
```

---

## 🎯 Features

### Core Modules (16 Total)

| Module | Status | Description |
|--------|--------|-------------|
| **Authentication** | ✅ Implemented | User registration, login, JWT management |
| **Admin** | ✅ Implemented | User management, roles, audit logs |
| **Client Management** | ⚠️ Stub | Client profiles, contacts, relationships |
| **Matter Management** | ⚠️ Stub | Case/matter tracking, workflows |
| **Document Management** | ⚠️ Stub | Document storage, versioning, search |
| **Billing** | ⚠️ Stub | Invoicing, payments, financial tracking |
| **Time Tracking** | ⚠️ Stub | Time entries, timers, billable hours |
| **Calendar** | ⚠️ Stub | Events, appointments, scheduling |
| **Tasks** | ⚠️ Stub | Task management, assignments, deadlines |
| **Communications** | ⚠️ Stub | Messaging, notifications, email |
| **Reporting** | ⚠️ Stub | Analytics, reports, dashboards |
| **Integrations** | ⚠️ Stub | Third-party service connections |
| **Compliance** | ⚠️ Stub | Regulatory compliance tracking |
| **Conflicts** | ⚠️ Stub | Conflict of interest checks |
| **Research** | ⚠️ Stub | Legal research tools |
| **Workflow** | ⚠️ Stub | Automated workflow engine |

### ATLAS Agentic Infrastructure

**Status**: ✅ Fully Implemented

The ATLAS (Autonomous Task & Learning Agent System) provides:

- **Agent Orchestration** - Lifecycle management, task routing, state machines
- **Knowledge Graph** - Entity relationships, semantic search, memory management
- **Event Bus** - Pub-sub messaging, event-driven workflows, real-time notifications

**12 Specialized Agents**:
- Client Management Agent
- Matter Management Agent
- Document Processing Agent
- Billing & Finance Agent
- Time Tracking Agent
- Calendar & Scheduling Agent
- Task Management Agent
- Communication Agent
- Reporting & Analytics Agent
- Integration Agent
- Compliance Agent
- Workflow Automation Agent

---

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Row-level security (RLS) in database
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: Protection against abuse
- **CORS**: Configurable origin restrictions
- **Environment Variables**: Sensitive data never committed

---

## 🧪 Testing

```bash
# Run all tests (planned)
npm test

# Run with coverage (planned)
npm run test:coverage

# Run specific test suite (planned)
npm test -- auth.test.js
```

---

## 📊 Module Status

### Legend
- ✅ **Implemented**: Fully functional with tests
- 🚧 **In Progress**: Under active development
- ⚠️ **Stub**: Basic structure, needs implementation
- ❌ **Not Started**: Planned but not begun

### Implementation Progress

| Category | Modules | Status |
|----------|---------|--------|
| **Core Infrastructure** | Auth, Admin, Health | ✅ Complete |
| **ATLAS Services** | Agents, Knowledge, Events | ✅ Complete |
| **Business Logic** | 13 domain modules | ⚠️ Stub |
| **Testing** | Unit, Integration, E2E | ❌ Planned |
| **Documentation** | API, Deployment | ✅ Complete |

---

## 🚀 Development

### Running Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=10000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@host:6543/postgres

# JWT
JWT_SECRET=your-secret-key
JWT_ISSUER=https://xxxxx.supabase.co/auth/v1
JWT_AUDIENCE=authenticated

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete configuration details.

### Database Migrations

Migrations are located in `database/migrations/` and must be run in order:

1. `001_foundation_admin.sql` - Core tables and admin module
2. `002_core_modules.sql` - Business domain modules
3. `003_support_agentic.sql` - ATLAS infrastructure
4. `004_seed_data.sql` - Initial data and agents

Run migrations using the Supabase SQL Editor or `psql`:

```bash
psql $DATABASE_URL < database/migrations/001_foundation_admin.sql
psql $DATABASE_URL < database/migrations/002_core_modules.sql
psql $DATABASE_URL < database/migrations/003_support_agentic.sql
psql $DATABASE_URL < database/migrations/004_seed_data.sql
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Write/update tests** (when testing is implemented)
5. **Update documentation** if needed
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Style

- Use ES modules (`import`/`export`)
- Follow existing code formatting
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions small and focused

### Commit Messages

Follow conventional commits:

```
feat: add client search functionality
fix: resolve authentication token expiry issue
docs: update API documentation for billing module
refactor: simplify agent orchestration logic
test: add unit tests for knowledge graph service
```

### Pull Request Process

1. Update README.md with details of changes if needed
2. Update docs/API.md if adding/changing endpoints
3. Ensure all tests pass (when implemented)
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 OC Pipeline

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Supabase** - Backend-as-a-Service platform
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Node.js** - Runtime environment

---

## 📚 References & Resources

### Agent Development Resources

- **[Salesforce Agent Script Recipes](https://github.com/trailheadapps/agent-script-recipes)** - Collection of example scripts and best practices for building AI agents. Useful reference for developers working on the ATLAS agentic infrastructure.

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/oc-pipeline-backend/issues)
- **Email**: support@ocpipeline.com
- **Discord**: [Join our community](https://discord.gg/ocpipeline)

---

## 🗺️ Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Core infrastructure
- [x] Authentication & authorization
- [x] Admin module
- [x] ATLAS agentic services
- [x] Database schema
- [x] Documentation

### Phase 2: Core Modules (🚧 In Progress)
- [ ] Client management implementation
- [ ] Matter management implementation
- [ ] Document management implementation
- [ ] Billing & invoicing implementation
- [ ] Time tracking implementation

### Phase 3: Advanced Features (📋 Planned)
- [ ] Calendar & scheduling
- [ ] Task management
- [ ] Communications
- [ ] Reporting & analytics
- [ ] Integrations framework

### Phase 4: AI & Automation (📋 Planned)
- [ ] Agent-driven workflows
- [ ] Document analysis
- [ ] Predictive analytics
- [ ] Natural language queries
- [ ] Automated compliance checks

### Phase 5: Enterprise (📋 Planned)
- [ ] Multi-tenancy
- [ ] Advanced security
- [ ] Performance optimization
- [ ] Scalability improvements
- [ ] Enterprise integrations

---

## 📈 Stats

- **Total Modules**: 16
- **Database Tables**: 126
- **API Endpoints**: 50+ (planned)
- **ATLAS Agents**: 12
- **Lines of Code**: ~15,000
- **Test Coverage**: TBD

---

**Built with ❤️ by the OC Pipeline Team**

[Website](https://ocpipeline.com) • [Documentation](docs/) • [API Reference](docs/API.md) • [GitHub](https://github.com/your-org/oc-pipeline-backend)