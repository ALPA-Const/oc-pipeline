# ISDC Module API Documentation

**Intelligent Submittal & Construction Documentation Module**

Base URL: `https://oc-pipeline.onrender.com/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Submittals](#submittals)
- [Specifications](#specifications)
- [Closeout](#closeout)
- [Data Models](#data-models)

---

## Authentication

All ISDC endpoints require authentication using JWT tokens.

```http
Authorization: Bearer <access_token>
```

---

## Submittals

### List Submittals

```http
GET /api/submittals
```

**Query Parameters:**
- `project_id` (required): Project UUID
- `status` (optional): Filter by status
- `submittal_type` (optional): Filter by type
- `spec_section` (optional): Filter by spec section
- `priority` (optional): Filter by priority
- `assigned_to` (optional): Filter by assignee
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `sort` (optional): Sort field (prefix with `-` for DESC)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submittals": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "submittal_number": "S-001",
        "revision": "A",
        "spec_section": "03 30 00",
        "submittal_title": "Cast-in-Place Concrete Mix Design",
        "submittal_type": "product_data",
        "description": "Concrete mix design for structural elements",
        "priority": "high",
        "status": "not_started",
        "source_type": "manual",
        "ai_extracted": false,
        "ai_confidence_score": null,
        "responsible_contractor": "uuid",
        "assigned_to": "uuid",
        "reviewer_id": "uuid",
        "required_date": "2024-02-15",
        "submitted_date": null,
        "reviewed_date": null,
        "approved_date": null,
        "is_long_lead": false,
        "is_critical_path": true,
        "buy_american_required": true,
        "davis_bacon_applicable": false,
        "assigned_to_name": "John Doe",
        "reviewer_name": "Jane Smith",
        "contractor_name": "ABC Construction",
        "item_count": 3,
        "review_count": 0,
        "created_at": "2024-01-20T10:00:00Z",
        "updated_at": "2024-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

---

### Get Submittal Details

```http
GET /api/submittals/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submittal": {
      "id": "uuid",
      "submittal_number": "S-001",
      "submittal_title": "Cast-in-Place Concrete Mix Design",
      "status": "under_review",
      "assigned_to_name": "John Doe",
      "assigned_to_email": "john@example.com",
      "reviewer_name": "Jane Smith",
      "reviewer_email": "jane@example.com",
      "contractor_name": "ABC Construction",
      "created_by_name": "Admin User"
    },
    "items": [
      {
        "id": "uuid",
        "submittal_id": "uuid",
        "item_number": 1,
        "product_name": "Structural Concrete 4000 PSI",
        "manufacturer": "Ready Mix Co",
        "model_number": "SM-4000",
        "quantity": 500,
        "unit": "CY",
        "location": "Foundation Level",
        "specification_reference": "03 30 00 - 2.1.A",
        "drawing_reference": "S-101",
        "substitution_allowed": true,
        "approved_manufacturer": null,
        "notes": "28-day compressive strength required"
      }
    ],
    "reviews": [
      {
        "id": "uuid",
        "submittal_id": "uuid",
        "review_round": 1,
        "reviewer_id": "uuid",
        "reviewer_name": "Jane Smith",
        "reviewer_email": "jane@example.com",
        "reviewer_role": "architect",
        "review_action": "approved_as_noted",
        "comments": "Approved with minor corrections to mix design",
        "markup_file_path": "/files/markups/S-001-R1.pdf",
        "reviewed_at": "2024-01-22T14:30:00Z"
      }
    ]
  }
}
```

---

### Create Submittal

```http
POST /api/submittals
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "submittal_number": "S-002",
  "spec_section": "08 11 00",
  "submittal_title": "Hollow Metal Doors and Frames",
  "submittal_type": "shop_drawing",
  "description": "Shop drawings for all hollow metal doors and frames",
  "priority": "normal",
  "responsible_contractor": "uuid",
  "assigned_to": "uuid",
  "reviewer_id": "uuid",
  "required_date": "2024-02-20",
  "is_long_lead": true,
  "is_critical_path": false,
  "items": [
    {
      "item_number": 1,
      "product_name": "Hollow Metal Door Frame",
      "manufacturer": "Steelcraft",
      "model_number": "HMF-3070",
      "quantity": 45,
      "unit": "EA",
      "specification_reference": "08 11 00 - 2.2"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "submittal": {
      "id": "uuid",
      "submittal_number": "S-002",
      "status": "not_started",
      "created_at": "2024-01-20T15:00:00Z"
    }
  }
}
```

---

### Update Submittal

```http
PATCH /api/submittals/:id
```

**Request Body:**
```json
{
  "submittal_title": "Updated Title",
  "priority": "high",
  "assigned_to": "new-user-uuid",
  "required_date": "2024-03-01"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submittal": {
      "id": "uuid",
      "updated_at": "2024-01-20T16:00:00Z"
    }
  }
}
```

---

### Update Submittal Status

```http
PATCH /api/submittals/:id/status
```

**Request Body:**
```json
{
  "status": "submitted",
  "comments": "Submittal package uploaded and ready for review"
}
```

**Valid Status Values:**
- `not_started`
- `in_progress`
- `submitted`
- `under_review`
- `approved`
- `approved_as_noted`
- `revise_resubmit`
- `rejected`
- `for_record_only`
- `void`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submittal": {
      "id": "uuid",
      "status": "submitted",
      "updated_at": "2024-01-20T17:00:00Z"
    }
  }
}
```

---

### Delete Submittal

```http
DELETE /api/submittals/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Submittal deleted successfully"
  }
}
```

---

### Export Submittals to Excel

```http
GET /api/submittals/export?project_id=uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "submittals": [...],
    "format": "json",
    "message": "Excel export will be implemented with exceljs library"
  }
}
```

---

## Specifications

### Upload Specification

```http
POST /api/specifications/upload
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "document_name": "Technical Specifications - Division 03",
  "document_type": "specification",
  "division": "03",
  "section_number": "03 30 00",
  "section_title": "Cast-in-Place Concrete",
  "file_path": "/uploads/specs/div03.pdf",
  "file_size_bytes": 2458624
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "specification": {
      "id": "uuid",
      "project_id": "uuid",
      "document_name": "Technical Specifications - Division 03",
      "processing_status": "pending",
      "upload_date": "2024-01-20T10:00:00Z"
    }
  }
}
```

---

### List Specifications

```http
GET /api/specifications?project_id=uuid&processing_status=completed
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "specifications": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "document_name": "Technical Specifications - Division 03",
        "document_type": "specification",
        "division": "03",
        "section_number": "03 30 00",
        "section_title": "Cast-in-Place Concrete",
        "file_path": "/uploads/specs/div03.pdf",
        "file_size_bytes": 2458624,
        "processing_status": "completed",
        "ai_processed_at": "2024-01-20T10:05:00Z",
        "ai_confidence_score": 88.5,
        "uploaded_by_name": "John Doe",
        "extraction_count": 1,
        "upload_date": "2024-01-20T10:00:00Z"
      }
    ]
  }
}
```

---

### Get Specification Details

```http
GET /api/specifications/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "specification": {
      "id": "uuid",
      "document_name": "Technical Specifications - Division 03",
      "processing_status": "completed",
      "ai_confidence_score": 88.5,
      "uploaded_by_name": "John Doe",
      "uploaded_by_email": "john@example.com"
    },
    "extractions": [
      {
        "id": "uuid",
        "extraction_type": "submittal",
        "confidence_score": 88.5,
        "model_version": "placeholder-v1.0",
        "processing_time_ms": 2150,
        "extraction_date": "2024-01-20T10:05:00Z",
        "reviewed": false
      }
    ]
  }
}
```

---

### Extract Submittals from Specification (AI)

```http
POST /api/specifications/:id/extract
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "extraction": {
      "id": "uuid",
      "project_id": "uuid",
      "source_document_id": "uuid",
      "extraction_type": "submittal",
      "confidence_score": 88.5,
      "model_version": "placeholder-v1.0",
      "processing_time_ms": 2150
    },
    "submittals": [
      {
        "spec_section": "03 30 00",
        "submittal_title": "Cast-in-Place Concrete Mix Design",
        "submittal_type": "product_data",
        "description": "Concrete mix design for structural elements",
        "priority": "high",
        "ai_confidence_score": 92.5,
        "is_long_lead": false,
        "is_critical_path": true,
        "buy_american_required": true,
        "items": [
          {
            "item_number": 1,
            "product_name": "Structural Concrete 4000 PSI",
            "specification_reference": "03 30 00 - 2.1.A",
            "quantity": 500,
            "unit": "CY"
          }
        ]
      }
    ],
    "metadata": {
      "documentId": "uuid",
      "projectId": "uuid",
      "processingTimeMs": 2150,
      "modelVersion": "placeholder-v1.0",
      "averageConfidence": 88.5
    }
  }
}
```

---

### Create Submittals from Extraction

```http
POST /api/specifications/:id/create-submittals
```

**Request Body:**
```json
{
  "extraction_id": "uuid",
  "selected_submittals": [0, 1, 2]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "submittals": [
      {
        "id": "uuid",
        "submittal_number": "AI-1705750000000",
        "submittal_title": "Cast-in-Place Concrete Mix Design",
        "status": "not_started",
        "ai_extracted": true,
        "ai_confidence_score": 92.5
      }
    ],
    "count": 3
  }
}
```

---

### Delete Specification

```http
DELETE /api/specifications/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Specification deleted successfully"
  }
}
```

---

## Closeout

### Get Closeout Dashboard

```http
GET /api/closeout/dashboard?project_id=uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_documents": 45,
      "completed": 32,
      "pending": 8,
      "in_progress": 5,
      "issues": 0,
      "completion_percentage": 71.11
    },
    "documentsByType": [
      {
        "document_type": "warranty",
        "count": 15,
        "completed": 12
      },
      {
        "document_type": "om_manual",
        "count": 10,
        "completed": 8
      },
      {
        "document_type": "as_built",
        "count": 8,
        "completed": 6
      }
    ],
    "subcontractorCompliance": [
      {
        "id": "uuid",
        "name": "ABC Mechanical",
        "total_documents": 12,
        "completed_documents": 10,
        "compliance_percentage": 83.33,
        "last_submission_date": "2024-01-18"
      }
    ],
    "recentActivity": [
      {
        "id": "uuid",
        "document_title": "HVAC Equipment Warranty",
        "document_type": "warranty",
        "status": "accepted",
        "received_date": "2024-01-18",
        "accepted_date": "2024-01-19",
        "subcontractor_name": "ABC Mechanical"
      }
    ]
  }
}
```

---

### List Closeout Documents

```http
GET /api/closeout/documents?project_id=uuid&status=not_received
```

**Query Parameters:**
- `project_id` (required): Project UUID
- `status` (optional): Filter by status
- `document_type` (optional): Filter by document type
- `subcontractor_id` (optional): Filter by subcontractor
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "document_type": "warranty",
        "document_title": "HVAC Equipment Warranty",
        "spec_section": "23 05 00",
        "subcontractor_id": "uuid",
        "subcontractor_name": "ABC Mechanical",
        "subcontractor_email": "contact@abcmech.com",
        "responsible_contact": "Mike Johnson",
        "required": true,
        "required_copies": 2,
        "format_required": "both",
        "status": "not_received",
        "warranty_duration_months": 12,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

### Create Closeout Document

```http
POST /api/closeout/documents
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "document_type": "warranty",
  "document_title": "HVAC Equipment Warranty",
  "spec_section": "23 05 00",
  "subcontractor_id": "uuid",
  "responsible_contact": "Mike Johnson",
  "required": true,
  "required_copies": 2,
  "format_required": "both",
  "warranty_duration_months": 12
}
```

**Document Types:**
- `warranty`
- `om_manual` (Operations & Maintenance Manual)
- `as_built`
- `test_report`
- `certificate`
- `attic_stock`
- `spare_parts`
- `training_record`
- `commissioning`
- `leed_documentation`
- `final_inspection`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "document_title": "HVAC Equipment Warranty",
      "status": "not_received",
      "created_at": "2024-01-20T10:00:00Z"
    }
  }
}
```

---

### Update Closeout Document

```http
PATCH /api/closeout/documents/:id
```

**Request Body:**
```json
{
  "status": "received",
  "received_date": "2024-01-22",
  "file_path": "/closeout/warranties/hvac-warranty.pdf",
  "file_name": "HVAC_Equipment_Warranty.pdf"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "status": "received",
      "received_date": "2024-01-22",
      "updated_at": "2024-01-22T14:00:00Z"
    }
  }
}
```

---

### Create Subcontractor Outreach

```http
POST /api/closeout/outreach
```

**Request Body:**
```json
{
  "project_id": "uuid",
  "subcontractor_id": "uuid",
  "outreach_type": "initial_request",
  "subject": "Closeout Documents Required - Project XYZ",
  "message_body": "Dear ABC Mechanical,\n\nWe are preparing for project closeout and require the following documents...",
  "documents_requested": ["doc-uuid-1", "doc-uuid-2"]
}
```

**Outreach Types:**
- `initial_request`
- `reminder_1`
- `reminder_2`
- `escalation`
- `final_notice`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "outreach": {
      "id": "uuid",
      "status": "draft",
      "created_at": "2024-01-20T10:00:00Z"
    }
  }
}
```

---

### Send Outreach Email

```http
POST /api/closeout/outreach/:id/send
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "outreach": {
      "id": "uuid",
      "status": "sent",
      "sent_at": "2024-01-20T11:00:00Z"
    },
    "message": "Email sending will be implemented with SendGrid/AWS SES"
  }
}
```

---

### Generate Closeout Package

```http
GET /api/closeout/package?project_id=uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "documents": [...],
    "packageByType": {
      "warranty": [...],
      "om_manual": [...],
      "as_built": [...]
    },
    "totalDocuments": 32,
    "generatedAt": "2024-01-20T15:00:00Z",
    "message": "PDF package generation will be implemented with PDFKit or similar"
  }
}
```

---

## Data Models

### Submittal

```typescript
interface Submittal {
  id: string;
  project_id: string;
  submittal_number: string;
  revision: string;
  spec_section: string;
  submittal_title: string;
  submittal_type: 'action' | 'informational' | 'closeout' | 'product_data' | 'shop_drawing' | 'sample' | 'test_report' | 'certificate' | 'warranty' | 'om_manual' | 'as_built' | 'leed';
  description: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  source_type: 'spec_ai' | 'drawing_ai' | 'manual' | 'import';
  source_document_id: string | null;
  ai_extracted: boolean;
  ai_confidence_score: number | null;
  responsible_contractor: string | null;
  assigned_to: string | null;
  reviewer_id: string | null;
  required_date: string | null;
  submitted_date: string | null;
  reviewed_date: string | null;
  approved_date: string | null;
  status: 'not_started' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'approved_as_noted' | 'revise_resubmit' | 'rejected' | 'for_record_only' | 'void';
  is_long_lead: boolean;
  is_critical_path: boolean;
  buy_american_required: boolean;
  davis_bacon_applicable: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### Specification

```typescript
interface Specification {
  id: string;
  project_id: string;
  document_name: string;
  document_type: 'specification' | 'addendum' | 'amendment';
  division: string | null;
  section_number: string | null;
  section_title: string | null;
  file_path: string;
  file_size_bytes: number;
  upload_date: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_processed_at: string | null;
  ai_confidence_score: number | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}
```

### Closeout Document

```typescript
interface CloseoutDocument {
  id: string;
  project_id: string;
  submittal_id: string | null;
  document_type: 'warranty' | 'om_manual' | 'as_built' | 'test_report' | 'certificate' | 'attic_stock' | 'spare_parts' | 'training_record' | 'commissioning' | 'leed_documentation' | 'final_inspection';
  document_title: string;
  spec_section: string | null;
  subcontractor_id: string | null;
  responsible_contact: string | null;
  required: boolean;
  required_copies: number;
  format_required: 'digital' | 'hard_copy' | 'both';
  status: 'not_received' | 'requested' | 'received' | 'under_review' | 'accepted' | 'rejected' | 'resubmit_required';
  received_date: string | null;
  accepted_date: string | null;
  file_path: string | null;
  file_name: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_duration_months: number | null;
  created_at: string;
  updated_at: string;
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Module**: ISDC (Intelligent Submittal & Document Control)