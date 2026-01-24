# ATLAS Agent File Access System

## Overview

The ATLAS Agent File Access System provides comprehensive file access management and auditing for AI agents in the OC Pipeline platform. This system enables secure, tracked, and permission-based file operations by AI agents while maintaining complete audit trails for compliance and security purposes.

## Features

### 1. File Access Tracking
- **Real-time monitoring** of all file accesses by AI agents
- **Detailed logging** of access type, duration, success/failure status
- **Context tracking** for task, project, and organization associations
- **Access reason documentation** for audit compliance

### 2. Permission Management
- **Granular permissions** (read, write, delete, analyze)
- **Pattern-based access control** (file patterns, MIME types, folders)
- **Scope-based permissions** (organization, project, global)
- **Time-based expiration** for temporary access grants
- **Permission revocation** capabilities

### 3. Operation Auditing
- **Complete operation history** (create, update, delete, move, copy)
- **File metadata preservation** for deleted files
- **Change tracking** for file modifications
- **Success/failure recording** with error messages

### 4. Analytics & Reporting
- **Access statistics** by agent, file, and time period
- **Success rate tracking** and performance metrics
- **Usage patterns** and trend analysis
- **Compliance reporting** capabilities

## Architecture

### Database Schema

#### Tables

1. **agent_file_access**
   - Tracks every file access by agents
   - Records access type, duration, and success status
   - Links to tasks, projects, and organizations

2. **agent_file_permissions**
   - Defines which agents can access which files
   - Supports file patterns, MIME types, and folder-based permissions
   - Includes expiration and revocation capabilities

3. **agent_file_operations**
   - Logs all file operations performed by agents
   - Preserves file metadata for audit purposes
   - Tracks changes and operation results

### Backend Services

#### AgentFileAccessService
Located in `backend/src/services/ai/agent-file-access.service.ts`

**Key Methods:**
- `checkFilePermission()` - Verify agent access rights
- `recordFileAccess()` - Log file access events
- `grantFilePermission()` - Grant access permissions
- `revokeFilePermission()` - Revoke access permissions
- `getAgentFileAccess()` - Retrieve access history
- `getAgentFileAccessStats()` - Get analytics data

### API Endpoints

All endpoints are prefixed with `/api/atlas`

#### File Access
- `GET /agents/:agentId/file-access/check` - Check permission
- `GET /agents/:agentId/file-access` - Get access history
- `POST /agents/:agentId/file-access` - Record access
- `GET /agents/:agentId/file-access/stats` - Get statistics

#### File History
- `GET /files/:fileId/access-history` - Get file access history

#### Permissions
- `GET /agents/:agentId/file-permissions` - List permissions
- `POST /agents/:agentId/file-permissions` - Grant permission
- `DELETE /file-permissions/:permissionId` - Revoke permission

#### Operations
- `GET /agents/:agentId/file-operations` - List operations
- `POST /agents/:agentId/file-operations` - Record operation

### Frontend Components

#### AgentFileAccessDashboard
Located in `frontend/src/components/atlas/AgentFileAccessDashboard.tsx`

**Features:**
- Three-tab interface (Access History, Permissions, Operations)
- Real-time statistics cards
- Filtering and pagination
- Success/failure status indicators
- Detailed access reason display

#### Pages
- `AtlasDashboard` - Main ATLAS command center
- `AtlasAgentFileAccess` - Agent-specific file access dashboard

## Usage

### Granting File Permissions

```typescript
import agentFileAccessService from '@/services/agent-file-access.service';

// Grant permission for PDF analysis
await agentFileAccessService.grantFilePermission(agentId, {
  mimeTypePattern: 'application/pdf',
  canRead: true,
  canAnalyze: true,
  orgId: organizationId,
  reason: 'Document analysis for bid estimation',
  expiresAt: new Date('2024-12-31')
});
```

### Recording File Access

```typescript
// Record successful file access
await agentFileAccessService.recordFileAccess(agentId, {
  fileId: fileId,
  accessType: 'analyze',
  accessReason: 'Extracting specifications for cost estimation',
  taskId: taskId,
  durationMs: 1250,
  success: true,
  metadata: {
    extractedItems: 42,
    confidence: 0.95
  }
});
```

### Checking Permissions

```typescript
// Check if agent can write to file
const { hasPermission } = await agentFileAccessService.checkFilePermission(
  agentId,
  fileId,
  'write'
);

if (!hasPermission) {
  throw new Error('Agent does not have write permission');
}
```

## Security

### Row Level Security (RLS)

All tables have RLS policies to ensure:
- Users can only see data from their organization
- Only users with `manage_org` permission can grant/revoke file permissions
- Service role can insert access/operation records for agent activities

### Permission Checks

Every file operation should:
1. Check permissions before access
2. Record the access attempt
3. Log success or failure
4. Include access reason for audit

### Audit Trail

Complete audit trail maintained for:
- All permission grants/revocations (who, when, why)
- Every file access (agent, file, type, duration, result)
- All file operations (type, changes, success)

## Access Types

- **read** - Basic file reading
- **write** - File modification
- **delete** - File deletion
- **analyze** - Information extraction without modification
- **extract** - Data extraction and processing
- **generate** - New content generation based on file

## Operation Types

- **create** - New file creation
- **update** - Existing file modification
- **delete** - File removal
- **move** - File relocation
- **copy** - File duplication

## Configuration

### Permission Patterns

File patterns use glob syntax:
- `*.pdf` - All PDF files
- `drawings/*` - All files in drawings folder
- `specifications/*.docx` - Word documents in specifications folder

MIME type patterns support wildcards:
- `application/pdf` - PDF files only
- `image/*` - All image files
- `application/vnd.openxmlformats-*` - Office documents

### Expiration

Permissions can have expiration dates:
- Temporary access for specific tasks
- Time-limited analysis permissions
- Automatic cleanup of unused permissions

## Monitoring

### Dashboard Features

1. **Statistics Cards**
   - Total accesses
   - Unique files accessed
   - Success rate
   - Average access duration

2. **Access History Table**
   - File name and type
   - Access type with color coding
   - Timestamp and duration
   - Success/failure status
   - Access reason

3. **Permissions Table**
   - File patterns or folders
   - Permission types (read/write/delete/analyze)
   - Scope (global/org/project)
   - Granted by and expiration
   - Active status

4. **Operations Table**
   - Operation type with icons
   - File details
   - Timestamp
   - File size
   - Success status

## Best Practices

1. **Always check permissions** before file operations
2. **Record all accesses** with meaningful reasons
3. **Use pattern-based permissions** for scalability
4. **Set expiration dates** for temporary access
5. **Review access logs** regularly for compliance
6. **Revoke unused permissions** periodically
7. **Document permission reasons** clearly
8. **Monitor success rates** for agent reliability

## Troubleshooting

### Permission Denied Errors

If an agent receives permission denied:
1. Check active permissions for the agent
2. Verify file pattern matches
3. Confirm MIME type if specified
4. Check permission hasn't expired
5. Verify organization/project scope

### Missing Access Records

If access records aren't appearing:
1. Verify RLS policies are enabled
2. Check user's organization access
3. Confirm service role credentials
4. Review backend logs for errors

## Future Enhancements

- [ ] Real-time WebSocket notifications for access events
- [ ] Advanced analytics and ML-based anomaly detection
- [ ] Automated permission recommendations
- [ ] Integration with external audit systems
- [ ] File access request workflow
- [ ] Bulk permission management
- [ ] Permission templates for common scenarios
- [ ] Access heat maps and visualization

## Related Documentation

- [ATLAS Agent Orchestration](./AGENTS.md)
- [Agent Task Management](./backend/README.md)
- [Security & Compliance](./docs/security.md)
- [Database Schema](./database/README.md)
