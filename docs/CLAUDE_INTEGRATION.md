# Claude AI Integration Guide

## Overview

OC Pipeline now includes an integrated Claude AI assistant called **ATLAS** (Autonomous Task Learning and Assistance System). This provides a conversational AI interface directly within the OEOC (O'Neill Elite Orchestration Console) module.

## Features

- **Interactive Chat**: Real-time streaming responses from Claude
- **Construction Expertise**: Pre-configured with construction management knowledge
- **Document Analysis**: Analyze RFPs, specifications, and contracts
- **Risk Assessment**: AI-powered risk analysis for projects
- **Token Tracking**: Monitor API usage per session

## Setup Instructions

### 1. Get an Anthropic API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in to your account
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (it starts with `sk-ant-...`)

### 2. Configure Backend Environment

Add the following to your `backend/.env` file:

```env
# Claude AI Configuration
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 3. Install Anthropic SDK

```bash
cd backend
npm install @anthropic-ai/sdk
```

### 4. Verify Installation

Start your backend server and test the health endpoint:

```bash
curl http://localhost:10000/api/claude/health
```

Expected response when configured correctly:

```json
{
  "success": true,
  "status": "healthy",
  "model": "claude-sonnet-4-20250514"
}
```

## API Endpoints

| Endpoint                       | Method | Description                            |
| ------------------------------ | ------ | -------------------------------------- |
| `/api/claude/chat`             | POST   | Send a message and get a response      |
| `/api/claude/chat/stream`      | POST   | Stream a response (Server-Sent Events) |
| `/api/claude/analyze-document` | POST   | Analyze a document                     |
| `/api/claude/assess-risk`      | POST   | Risk assessment for project data       |
| `/api/claude/health`           | GET    | Check API configuration status         |

## Usage in Frontend

### Accessing AI Chat

1. Navigate to **/oeoc** (OEOC Command Center)
2. Click on **AI Chat** in the navigation bar
3. Start chatting with ATLAS

### Example API Usage

```typescript
import { claudeService } from "@/services/claude.service";

// Simple chat
const response = await claudeService.sendMessage(
  "What safety metrics should I track?",
  [], // conversation history
  { module: "Safety" } // context
);

// Streaming chat
await claudeService.streamMessage(
  "Explain TRIR calculation",
  [],
  { module: "Safety" },
  (chunk) => console.log(chunk), // on each chunk
  (usage) => console.log("Tokens used:", usage) // on complete
);

// Document analysis
const analysis = await claudeService.analyzeDocument(documentContent, "RFP");

// Risk assessment
const risk = await claudeService.assessRisk({
  projectName: "Federal Building Renovation",
  value: 5000000,
  duration: "18 months",
  setAside: "8(a)",
});
```

## System Prompt

ATLAS is configured with construction-specific knowledge including:

- Federal construction projects (NIST 800-171, SOC 2, FISMA)
- Preconstruction: bids, estimates, pursuits
- Cost management: budgets, change orders, forecasts
- Schedule management: Gantt charts, critical path
- Risk management: risk registers, mitigation
- Quality management: inspections, punch lists
- Safety: OSHA compliance, TRIR, DART, EMR
- Procurement: vendors, contracts, subcontracts
- Communications: RFIs, submittals, daily reports
- Project closeout: warranties, as-builts

## Cost Considerations

Claude API usage is billed by tokens:

- Input tokens: Cost per million tokens
- Output tokens: Cost per million tokens

The AI Chat interface displays token usage for transparency.

## Security Notes

1. **API Key Security**: Never expose your API key in frontend code
2. **Rate Limiting**: Consider implementing rate limiting for production
3. **User Authentication**: The Claude endpoints are protected routes
4. **Logging**: Sensitive conversations are not logged to the database

## Troubleshooting

### "Offline" Status in AI Chat

1. Check that `ANTHROPIC_API_KEY` is set in backend `.env`
2. Verify the API key is valid and has credits
3. Ensure the backend server is running
4. Check CORS settings if frontend is on different origin

### Streaming Not Working

1. Ensure no proxy is buffering SSE responses
2. Check that Content-Type headers are preserved
3. Verify firewall allows keep-alive connections

### Rate Limit Errors

1. Implement request queuing
2. Add retry logic with exponential backoff
3. Consider upgrading your Anthropic plan

## Files Created/Modified

### Backend

- `backend/src/services/ai/claude.service.ts` - Claude API integration
- `backend/src/routes/claude.routes.ts` - API endpoints
- `backend/src/server.ts` - Route registration

### Frontend

- `frontend/src/services/claude.service.ts` - API client
- `frontend/src/components/oeoc/AIChat.tsx` - Chat component
- `frontend/src/pages/oeoc/AIChatPage.tsx` - Page wrapper
- `frontend/src/pages/oeoc/OEOCLayout.tsx` - Navigation update
- `frontend/src/pages/oeoc/index.ts` - Export update
- `frontend/src/App.tsx` - Route registration

## Next Steps

1. Add conversation persistence to database
2. Implement prompt templates for common queries
3. Add file upload for document analysis
4. Create project-specific AI assistants
5. Build automated workflow triggers

---

_Integration created: December 2024_
_Model: Claude claude-sonnet-4-20250514_
