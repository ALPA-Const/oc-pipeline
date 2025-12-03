# OC Pipeline API Documentation

**Base URL**: `https://oc-pipeline.onrender.com/api`

**Version**: 1.0.0

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Modules](#modules)
  - [Authentication](#module-authentication)
  - [Admin](#module-admin)
  - [Client Management](#module-client-management)
  - [Matter Management](#module-matter-management)
  - [Document Management](#module-document-management)
  - [Billing](#module-billing)
  - [Time Tracking](#module-time-tracking)
  - [Calendar](#module-calendar)
  - [Tasks](#module-tasks)
  - [Communications](#module-communications)
  - [Reporting](#module-reporting)
  - [Integrations](#module-integrations)
  - [AI Services](#module-ai-services)

---

## Authentication

All protected endpoints require authentication using JWT tokens.

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Lifecycle

- **Access Token**: Valid for 1 hour
- **Refresh Token**: Valid for 7 days
- Use `/api/auth/refresh` to obtain new access token

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642521600
```

---

## Modules

### Module: Authentication

**Base Path**: `/api/auth`

#### Register User

```http
POST /api/auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "created_at": "2024-01-15T10:00:00Z"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 3600
    }
  }
}
```

**Permissions**: None (public)

---

#### Login

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe"
    },
    "session": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 3600
    }
  }
}
```

**Permissions**: None (public)

---

#### Get Current User

```http
GET /api/auth/me
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "permissions": ["read:own", "write:own"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Permissions**: Authenticated

---

#### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body**:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 3600
  }
}
```

**Permissions**: None (requires valid refresh token)

---

#### Logout

```http
POST /api/auth/logout
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

**Permissions**: Authenticated

---

### Module: Admin

**Base Path**: `/api/admin`

#### List Users

```http
GET /api/admin/users?page=1&limit=20&role=user&search=john
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Response** (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe",
        "role": "user",
        "status": "active",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

**Permissions**: `admin:users:read`

---

#### Get User Details

```http
GET /api/admin/users/:userId
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "status": "active",
      "permissions": ["read:own", "write:own"],
      "workspaces": [
        {
          "id": "uuid",
          "name": "My Workspace",
          "role": "member"
        }
      ],
      "created_at": "2024-01-15T10:00:00Z",
      "last_login": "2024-01-20T14:30:00Z"
    }
  }
}
```

**Permissions**: `admin:users:read`

---

#### Update User

```http
PATCH /api/admin/users/:userId
```

**Request Body**:
```json
{
  "full_name": "John Smith",
  "role": "admin",
  "status": "active"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Smith",
      "role": "admin",
      "status": "active",
      "updated_at": "2024-01-20T15:00:00Z"
    }
  }
}
```

**Permissions**: `admin:users:write`

---

#### Delete User

```http
DELETE /api/admin/users/:userId
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Permissions**: `admin:users:delete`

---

#### List Roles

```http
GET /api/admin/roles
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "uuid",
        "name": "admin",
        "description": "Administrator with full access",
        "permissions": ["admin:*"],
        "user_count": 5
      }
    ]
  }
}
```

**Permissions**: `admin:roles:read`

---

#### Audit Logs

```http
GET /api/admin/audit-logs?user_id=uuid&action=login&start_date=2024-01-01&end_date=2024-01-31
```

**Query Parameters**:
- `user_id` (optional): Filter by user
- `action` (optional): Filter by action type
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "user_email": "user@example.com",
        "action": "login",
        "resource_type": "auth",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250
    }
  }
}
```

**Permissions**: `admin:audit:read`

---

### Module: Client Management

**Base Path**: `/api/clients`

**Status**: ⚠️ Stub Implementation

#### List Clients

```http
GET /api/clients?page=1&limit=20&search=acme&type=corporate
```

**Permissions**: `clients:read`

---

#### Get Client

```http
GET /api/clients/:clientId
```

**Permissions**: `clients:read`

---

#### Create Client

```http
POST /api/clients
```

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "type": "corporate",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  }
}
```

**Permissions**: `clients:write`

---

#### Update Client

```http
PATCH /api/clients/:clientId
```

**Permissions**: `clients:write`

---

#### Delete Client

```http
DELETE /api/clients/:clientId
```

**Permissions**: `clients:delete`

---

### Module: Matter Management

**Base Path**: `/api/matters`

**Status**: ⚠️ Stub Implementation

#### List Matters

```http
GET /api/matters?client_id=uuid&status=active&page=1
```

**Permissions**: `matters:read`

---

#### Get Matter

```http
GET /api/matters/:matterId
```

**Permissions**: `matters:read`

---

#### Create Matter

```http
POST /api/matters
```

**Request Body**:
```json
{
  "client_id": "uuid",
  "title": "Contract Negotiation",
  "description": "Review and negotiate vendor contract",
  "matter_type": "contract",
  "status": "active",
  "billing_type": "hourly",
  "hourly_rate": 350.00
}
```

**Permissions**: `matters:write`

---

#### Update Matter

```http
PATCH /api/matters/:matterId
```

**Permissions**: `matters:write`

---

#### Close Matter

```http
POST /api/matters/:matterId/close
```

**Permissions**: `matters:write`

---

### Module: Document Management

**Base Path**: `/api/documents`

**Status**: ⚠️ Stub Implementation

#### List Documents

```http
GET /api/documents?matter_id=uuid&category=contract&page=1
```

**Permissions**: `documents:read`

---

#### Get Document

```http
GET /api/documents/:documentId
```

**Permissions**: `documents:read`

---

#### Upload Document

```http
POST /api/documents
Content-Type: multipart/form-data
```

**Form Data**:
- `file`: Document file
- `matter_id`: UUID
- `category`: Document category
- `description`: Optional description

**Permissions**: `documents:write`

---

#### Download Document

```http
GET /api/documents/:documentId/download
```

**Permissions**: `documents:read`

---

#### Delete Document

```http
DELETE /api/documents/:documentId
```

**Permissions**: `documents:delete`

---

### Module: Billing

**Base Path**: `/api/billing`

**Status**: ⚠️ Stub Implementation

#### List Invoices

```http
GET /api/billing/invoices?client_id=uuid&status=unpaid
```

**Permissions**: `billing:read`

---

#### Get Invoice

```http
GET /api/billing/invoices/:invoiceId
```

**Permissions**: `billing:read`

---

#### Create Invoice

```http
POST /api/billing/invoices
```

**Request Body**:
```json
{
  "client_id": "uuid",
  "matter_id": "uuid",
  "line_items": [
    {
      "description": "Legal consultation",
      "quantity": 5,
      "rate": 350.00,
      "amount": 1750.00
    }
  ],
  "due_date": "2024-02-15"
}
```

**Permissions**: `billing:write`

---

#### Record Payment

```http
POST /api/billing/invoices/:invoiceId/payments
```

**Request Body**:
```json
{
  "amount": 1750.00,
  "payment_method": "check",
  "payment_date": "2024-02-10",
  "reference": "CHK-12345"
}
```

**Permissions**: `billing:write`

---

### Module: Time Tracking

**Base Path**: `/api/time`

**Status**: ⚠️ Stub Implementation

#### List Time Entries

```http
GET /api/time/entries?matter_id=uuid&user_id=uuid&start_date=2024-01-01
```

**Permissions**: `time:read`

---

#### Create Time Entry

```http
POST /api/time/entries
```

**Request Body**:
```json
{
  "matter_id": "uuid",
  "description": "Client meeting and contract review",
  "duration": 120,
  "billable": true,
  "date": "2024-01-20"
}
```

**Permissions**: `time:write`

---

#### Start Timer

```http
POST /api/time/timer/start
```

**Request Body**:
```json
{
  "matter_id": "uuid",
  "description": "Working on contract"
}
```

**Permissions**: `time:write`

---

#### Stop Timer

```http
POST /api/time/timer/stop
```

**Permissions**: `time:write`

---

### Module: Calendar

**Base Path**: `/api/calendar`

**Status**: ⚠️ Stub Implementation

#### List Events

```http
GET /api/calendar/events?start_date=2024-01-01&end_date=2024-01-31
```

**Permissions**: `calendar:read`

---

#### Create Event

```http
POST /api/calendar/events
```

**Request Body**:
```json
{
  "title": "Client Meeting",
  "description": "Discuss contract terms",
  "start_time": "2024-01-25T14:00:00Z",
  "end_time": "2024-01-25T15:00:00Z",
  "location": "Conference Room A",
  "attendees": ["user@example.com"]
}
```

**Permissions**: `calendar:write`

---

### Module: Tasks

**Base Path**: `/api/tasks`

**Status**: ⚠️ Stub Implementation

#### List Tasks

```http
GET /api/tasks?status=pending&assigned_to=uuid
```

**Permissions**: `tasks:read`

---

#### Create Task

```http
POST /api/tasks
```

**Request Body**:
```json
{
  "title": "Review contract",
  "description": "Review vendor contract for compliance",
  "matter_id": "uuid",
  "assigned_to": "uuid",
  "due_date": "2024-01-30",
  "priority": "high"
}
```

**Permissions**: `tasks:write`

---

#### Update Task Status

```http
PATCH /api/tasks/:taskId
```

**Request Body**:
```json
{
  "status": "completed"
}
```

**Permissions**: `tasks:write`

---

### Module: Communications

**Base Path**: `/api/communications`

**Status**: ⚠️ Stub Implementation

#### List Messages

```http
GET /api/communications/messages?matter_id=uuid
```

**Permissions**: `communications:read`

---

#### Send Message

```http
POST /api/communications/messages
```

**Request Body**:
```json
{
  "recipient_id": "uuid",
  "subject": "Contract Update",
  "body": "Please review the updated contract terms.",
  "matter_id": "uuid"
}
```

**Permissions**: `communications:write`

---

### Module: Reporting

**Base Path**: `/api/reports`

**Status**: ⚠️ Stub Implementation

#### Generate Report

```http
POST /api/reports/generate
```

**Request Body**:
```json
{
  "report_type": "billing_summary",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "filters": {
    "client_id": "uuid"
  }
}
```

**Permissions**: `reports:read`

---

#### List Reports

```http
GET /api/reports?type=billing_summary
```

**Permissions**: `reports:read`

---

### Module: Integrations

**Base Path**: `/api/integrations`

**Status**: ⚠️ Stub Implementation

#### List Integrations

```http
GET /api/integrations
```

**Permissions**: `integrations:read`

---

#### Configure Integration

```http
POST /api/integrations/:integrationType/configure
```

**Request Body**:
```json
{
  "api_key": "sk_test_...",
  "settings": {
    "auto_sync": true
  }
}
```

**Permissions**: `integrations:write`

---

### Module: AI Services

**Base Path**: `/api/ai`

**Status**: ✅ Implemented (Agent Orchestration, Knowledge Graph, Event Bus)

#### List Agents

```http
GET /api/ai/agents?status=active&module=client_management
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "agent_id": "uuid",
        "name": "Client Management Agent",
        "module": "client_management",
        "type": "specialist",
        "status": "ACTIVE",
        "last_heartbeat": "2024-01-20T15:30:00Z"
      }
    ]
  }
}
```

**Permissions**: `ai:agents:read`

---

#### Get Agent Details

```http
GET /api/ai/agents/:agentId
```

**Permissions**: `ai:agents:read`

---

#### Start Agent

```http
POST /api/ai/agents/:agentId/start
```

**Permissions**: `ai:agents:write`

---

#### Stop Agent

```http
POST /api/ai/agents/:agentId/stop
```

**Permissions**: `ai:agents:write`

---

#### Assign Task to Agent

```http
POST /api/ai/agents/:agentId/tasks
```

**Request Body**:
```json
{
  "type": "process_document",
  "payload": {
    "document_id": "uuid",
    "action": "extract_entities"
  },
  "priority": 5
}
```

**Permissions**: `ai:agents:write`

---

#### Query Knowledge Graph

```http
POST /api/ai/knowledge/search
```

**Request Body**:
```json
{
  "workspace_id": "uuid",
  "query": "contract negotiations",
  "node_type": "document"
}
```

**Permissions**: `ai:knowledge:read`

---

#### Create Knowledge Node

```http
POST /api/ai/knowledge/nodes
```

**Request Body**:
```json
{
  "workspace_id": "uuid",
  "node_type": "entity",
  "label": "Acme Corporation",
  "properties": {
    "type": "client",
    "industry": "technology"
  }
}
```

**Permissions**: `ai:knowledge:write`

---

#### Subscribe to Events

```http
POST /api/ai/events/subscribe
```

**Request Body**:
```json
{
  "agent_id": "uuid",
  "event_type": "document.created",
  "filter": {
    "category": "contract"
  }
}
```

**Permissions**: `ai:events:write`

---

#### Publish Event

```http
POST /api/ai/events/publish
```

**Request Body**:
```json
{
  "event_type": "task.completed",
  "source": "agent-uuid",
  "payload": {
    "task_id": "uuid",
    "result": "success"
  }
}
```

**Permissions**: `ai:events:write`

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response includes**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Filtering & Sorting

Most list endpoints support filtering and sorting:

**Query Parameters**:
- `sort`: Field to sort by (prefix with `-` for descending)
- `filter[field]`: Filter by field value

**Example**:
```http
GET /api/clients?sort=-created_at&filter[type]=corporate&filter[status]=active
```

---

## Webhooks

Configure webhooks to receive real-time notifications:

```http
POST /api/webhooks
```

**Request Body**:
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["invoice.created", "payment.received"],
  "secret": "your-webhook-secret"
}
```

**Webhook Payload**:
```json
{
  "event": "invoice.created",
  "timestamp": "2024-01-20T15:00:00Z",
  "data": {
    "invoice_id": "uuid",
    "client_id": "uuid",
    "amount": 1750.00
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```javascript
import { OCPipelineClient } from '@ocpipeline/sdk';

const client = new OCPipelineClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://oc-pipeline.onrender.com/api'
});

// List clients
const clients = await client.clients.list({ page: 1, limit: 20 });

// Create invoice
const invoice = await client.billing.createInvoice({
  client_id: 'uuid',
  line_items: [...]
});
```

### Python

```python
from ocpipeline import OCPipelineClient

client = OCPipelineClient(
    api_key='your-api-key',
    base_url='https://oc-pipeline.onrender.com/api'
)

# List clients
clients = client.clients.list(page=1, limit=20)

# Create invoice
invoice = client.billing.create_invoice(
    client_id='uuid',
    line_items=[...]
)
```

---

## Support

- **Documentation**: [docs.ocpipeline.com](https://docs.ocpipeline.com)
- **API Status**: [status.ocpipeline.com](https://status.ocpipeline.com)
- **Support Email**: support@ocpipeline.com
- **GitHub Issues**: [github.com/ocpipeline/backend/issues](https://github.com)

---

**Last Updated**: January 2024