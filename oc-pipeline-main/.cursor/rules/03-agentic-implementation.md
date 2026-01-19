**OC PIPELINE**

BACKEND REBUILD SPECIFICATION

**DOCUMENT 3 OF 3**

Agentic Infrastructure + Core Implementation + Deployment

*Version 2.0 - Agentic Edition*

Date: November 2025

**CONFIDENTIAL - INTERNAL USE ONLY**

1\. AGENTIC INFRASTRUCTURE (ATLAS)

1.1 ATLAS System Overview

ATLAS (Autonomous Technical Leadership & Architectural Synthesis) is the
agentic AI system that orchestrates specialized sub-agents for each
module.

1.2 Agent Registry

  -------------------------------------------------------------------------
  **Agent ID**    **Name**           **Responsibilities**
  --------------- ------------------ --------------------------------------
  atlas-001       ATLAS Orchestrator Master coordinator, routes tasks,
                                     governance

  precon-001      Preconstruction    Estimates, bids, pipeline, AI
                  Agent              extraction

  admin-001       Administration     Users, roles, audit, settings
                  Agent              

  docs-001        Documents Agent    Document management, version control

  cost-001        Cost Agent         Budgets, change orders, forecasting

  schedule-001    Schedule Agent     Timeline, milestones, SPI tracking

  risk-001        Risk Agent         Risk register, mitigation planning

  quality-001     Quality Agent      Deficiencies, inspections, punch lists

  safety-001      Safety Agent       OSHA compliance, incidents, metrics

  procure-001     Procurement Agent  Vendors, contracts, POs

  comms-001       Communications     RFIs, submittals, approvals
                  Agent              

  staff-001       Staffing Agent     Resources, utilization, certs

  close-001       Closeout Agent     Warranties, handover, lessons

  portfolio-001   Portfolio Agent    Analytics, KPIs, reporting

  tasks-001       Tasks Agent        Cross-module task coordination

  finance-001     Finance Agent      Detailed financial analysis
  -------------------------------------------------------------------------

1.3 Agent Lifecycle States

  -----------------------------------------------------------------------
  **State**         **Description**
  ----------------- -----------------------------------------------------
  DORMANT           Agent registered but not activated (module not yet
                    built)

  INITIALIZING      Agent starting up, loading configuration

  ACTIVE            Agent running and processing tasks

  PAUSED            Agent temporarily suspended

  ERROR             Agent encountered error, needs attention

  TERMINATED        Agent shut down
  -----------------------------------------------------------------------

1.4 Agent Autonomy Boundaries

- READ operations: Full autonomy within assigned module

- WRITE operations: Stage changes, require human approval

- DELETE operations: Always require explicit human approval

- Cross-module operations: Coordinate through ATLAS orchestrator

- Financial changes \> \$10,000: Escalate to human

2\. CORE IMPLEMENTATION FILES

2.1 package.json

{

\"name\": \"oc-pipeline-backend\",

\"version\": \"2.0.0\",

\"type\": \"module\",

\"main\": \"src/index.js\",

\"scripts\": {

\"start\": \"node src/index.js\",

\"dev\": \"node \--watch src/index.js\"

},

\"dependencies\": {

\"express\": \"\^4.19.2\",

\"pg\": \"\^8.12.0\",

\"@supabase/supabase-js\": \"\^2.45.0\",

\"jsonwebtoken\": \"\^9.0.2\",

\"helmet\": \"\^7.1.0\",

\"cors\": \"\^2.8.5\",

\"morgan\": \"\^1.10.0\",

\"zod\": \"\^3.23.8\",

\"compression\": \"\^1.7.4\",

\"express-rate-limit\": \"\^7.4.0\",

\"uuid\": \"\^9.0.1\",

\"dotenv\": \"\^16.4.5\"

}

}

2.2 src/index.js

import app from \'./app.js\';

const PORT = process.env.PORT \|\| 10000;

app.listen(PORT, () =\> {

console.log(\`\[OC Pipeline\] Server running on port \${PORT}\`);

console.log(\`\[OC Pipeline\] Environment: \${process.env.NODE_ENV}\`);

console.log(\`\[OC Pipeline\] Health:
http://localhost:\${PORT}/health\`);

});

2.3 src/app.js (Express Configuration)

import express from \'express\';

import helmet from \'helmet\';

import cors from \'cors\';

import compression from \'compression\';

import morgan from \'morgan\';

import { v4 as uuidv4 } from \'uuid\';

import { rateLimit } from \'express-rate-limit\';

import routes from \'./routes/index.js\';

import { errorHandler } from \'./middleware/errorHandler.js\';

const app = express();

// Security

app.use(helmet());

// CORS with dynamic origin

const allowedOrigins = (process.env.ALLOWED_ORIGINS \|\|
\'\').split(\',\');

app.use(cors({

origin: (origin, callback) =\> {

if (!origin \|\| allowedOrigins.includes(origin)) {

callback(null, true);

} else {

callback(new Error(\'CORS not allowed\'));

}

},

credentials: true

}));

// Rate limiting

app.use(rateLimit({

windowMs: 15 \* 60 \* 1000,

max: 100,

standardHeaders: true,

legacyHeaders: false

}));

// Compression & parsing

app.use(compression());

app.use(express.json({ limit: \'10mb\' }));

app.use(express.urlencoded({ extended: true }));

// Request ID

app.use((req, res, next) =\> {

req.id = uuidv4();

res.setHeader(\'X-Request-Id\', req.id);

next();

});

// Logging

app.use(morgan(\':method :url :status - :response-time ms\'));

// Routes

app.use(\'/api\', routes);

app.use(\'/\', routes);

// Error handler

app.use(errorHandler);

export default app;

2.4 src/config/supabase.js

import { createClient } from \'@supabase/supabase-js\';

const supabaseUrl = process.env.SUPABASE_URL;

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client (respects RLS)

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS)

export const supabaseAdmin = createClient(supabaseUrl,
supabaseServiceKey, {

auth: { autoRefreshToken: false, persistSession: false }

});

2.5 src/config/database.js

import pg from \'pg\';

const { Pool } = pg;

const pool = new Pool({

connectionString: process.env.DATABASE_URL,

ssl: { rejectUnauthorized: false },

max: 10,

idleTimeoutMillis: 30000,

connectionTimeoutMillis: 2000

});

export const query = (text, params) =\> pool.query(text, params);

export default pool;

2.6 src/middleware/auth.js

import { supabaseAdmin } from \'../config/supabase.js\';

export const authenticate = async (req, res, next) =\> {

try {

const authHeader = req.headers.authorization;

if (!authHeader?.startsWith(\'Bearer \')) {

return res.status(401).json({

success: false,

error: { code: \'UNAUTHORIZED\', message: \'Missing token\' }

});

}

const token = authHeader.substring(7);

const { data: { user }, error } = await
supabaseAdmin.auth.getUser(token);

if (error \|\| !user) {

return res.status(401).json({

success: false,

error: { code: \'INVALID_TOKEN\', message: \'Invalid or expired token\'
}

});

}

req.user = user;

req.token = token;

next();

} catch (err) {

return res.status(401).json({

success: false,

error: { code: \'AUTH_ERROR\', message: err.message }

});

}

};

2.7 src/middleware/rbac.js

// 8 roles x 23 permissions matrix

const ROLE_PERMISSIONS = {

admin: {

view: true, create: true, edit: true, delete: true, approve: true,

export: true, comment: true, assign: true, close: true, reopen: true,

archive: true, unarchive: true, change_status: true, change_budget:
true,

change_schedule: true, view_budget: true, view_schedule: true,

view_safety: true, view_quality: true, manage_users: true,

manage_roles: true, manage_org: true

},

exec: {

view: true, create: false, edit: false, delete: false, approve: true,

export: true, comment: true, assign: false, close: false, reopen: false,

archive: false, unarchive: false, change_status: false, change_budget:
false,

change_schedule: false, view_budget: true, view_schedule: true,

view_safety: true, view_quality: true, manage_users: false,

manage_roles: false, manage_org: false

},

pm: { /\* \... full permissions \... \*/ },

pe: { /\* \... permissions \... \*/ },

super: { /\* \... permissions \... \*/ },

precon: { /\* \... permissions \... \*/ },

sub: { /\* \... limited permissions \... \*/ },

client: { view: true, comment: true /\* \... view-only \... \*/ }

};

export const requirePermission = (permission) =\> {

return (req, res, next) =\> {

const userRole = req.user?.role \|\| \'client\';

const permissions = ROLE_PERMISSIONS\[userRole\] \|\| {};

if (!permissions\[permission\]) {

return res.status(403).json({

success: false,

error: { code: \'FORBIDDEN\', message: \'Permission denied\' }

});

}

next();

};

};

2.8 src/middleware/errorHandler.js

export const errorHandler = (err, req, res, next) =\> {

console.error(\`\[\${req.id}\] Error:\`, err.message);

const statusCode = err.statusCode \|\| 500;

const code = err.code \|\| \'INTERNAL_ERROR\';

res.status(statusCode).json({

success: false,

error: {

code,

message: err.message \|\| \'Internal server error\',

requestId: req.id

}

});

};

2.9 src/routes/health.routes.js

import express from \'express\';

import { query } from \'../config/database.js\';

const router = express.Router();

router.get(\'/\', (req, res) =\> {

res.json({

success: true,

data: {

status: \'healthy\',

timestamp: new Date().toISOString(),

version: \'2.0.0\'

}

});

});

router.get(\'/detailed\', async (req, res) =\> {

try {

const result = await query(\'SELECT NOW() as time\');

res.json({

success: true,

data: {

status: \'healthy\',

database: \'connected\',

dbTime: result.rows\[0\].time,

uptime: process.uptime()

}

});

} catch (err) {

res.status(503).json({

success: false,

error: { code: \'DB_ERROR\', message: \'Database connection failed\' }

});

}

});

export default router;

3\. DEPLOYMENT & TESTING

3.1 Render Deployment Settings

  -----------------------------------------------------------------------
  **Setting**                **Value**
  -------------------------- --------------------------------------------
  Build Command              npm install

  Start Command              npm start

  Node Version               20

  Instance Type              Starter (\$7/mo) or higher

  Region                     Oregon (US West)

  Auto-Deploy                Yes (from main branch)

  Health Check Path          /health
  -----------------------------------------------------------------------

3.2 Testing Commands

After deployment, test with these cURL commands:

**Health Check:**

curl https://oc-pipeline.onrender.com/health

**Detailed Health:**

curl https://oc-pipeline.onrender.com/health/detailed

**Login:**

curl -X POST https://oc-pipeline.onrender.com/api/auth/login \\

-H \"Content-Type: application/json\" \\

-d \'{\"email\":\"test@example.com\",\"password\":\"password123\"}\'

**Authenticated Request:**

curl https://oc-pipeline.onrender.com/api/precon/projects \\

-H \"Authorization: Bearer YOUR_TOKEN_HERE\"

4\. CRITICAL NOTES FOR AI DEVELOPER

4.1 MUST DO

- Use ES Modules (\"type\": \"module\" in package.json)

- All database queries MUST use parameterized queries (SQL injection
  prevention)

- Error responses MUST follow standardized format: { success, data/error
  }

- Authentication uses Supabase Auth - tokens verified against Supabase

- RBAC defined in src/middleware/rbac.js based on 8-role matrix

- Log all errors with request IDs for tracing

- Use async/await consistently throughout

- Return proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)

- Validate ALL input data using Zod schemas

4.2 MUST NOT DO

- NEVER store sensitive data in logs

- NEVER use string concatenation for SQL queries

- NEVER expose stack traces in production responses

- NEVER hardcode credentials in source code

- NEVER trust user input without validation

- NEVER bypass authentication for protected routes

4.3 Response Format Standard

**Success Response:**

{ \"success\": true, \"data\": { \... } }

**Error Response:**

{ \"success\": false, \"error\": { \"code\": \"ERROR_CODE\",
\"message\": \"\...\" } }

4.4 Phased Build Strategy

Build foundation ONCE, implement features per module:

- Phase 0 (Foundation): Create ALL tables (empty), ALL route stubs,
  agentic infrastructure

- Phase 1: Preconstruction + AI Estimator (activate Preconstruction
  Agent)

- Phase 2: Administration (activate Admin Agent)

- Phase 3: Documents (activate Documents Agent)

- Phase 4-16: Remaining modules in priority order

5\. DOCUMENT SET SUMMARY

  ------------------------------------------------------------------------
  **Doc**     **Title**                      **Contents**
  ----------- ------------------------------ -----------------------------
  1/3         Foundation & Database          Environment vars, 126
                                             database tables, tech stack

  2/3         API Routes & Structure         Folder structure, ALL API
                                             endpoints, route stubs

  3/3         Agentic + Implementation       ATLAS agents, core code
                                             files, deployment, notes
  ------------------------------------------------------------------------

**TOTAL SCOPE:**

- 126 database tables across 16 modules + agentic infrastructure

- 60+ route files with CRUD endpoints for all modules

- 17 agents (1 orchestrator + 16 module agents)

- 8 roles x 23 permissions RBAC matrix

- Complete deployment configuration for Render + Supabase

**END OF DOCUMENT 3 OF 3**

**SPECIFICATION COMPLETE**
