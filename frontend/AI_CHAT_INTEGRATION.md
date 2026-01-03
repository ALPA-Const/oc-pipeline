# AI Chat Integration Guide

## Overview

The OC Pipeline AI Chat interface now supports full integration with Groq's API, including your custom GPT ODD 120B model, with comprehensive settings similar to ChatGPT and Claude, plus file upload capabilities with multiple storage providers.

## Features

### 🤖 AI Model Configuration
- **GPT ODD 120B**: Your custom 120B parameter model optimized for construction domain
- **Llama 3.3 70B**: Meta's latest with improved reasoning
- **Llama 3.1 8B Instant**: Fast responses for quick queries
- **Mixtral 8x7B**: Mixture of experts model
- **Gemma 7B IT**: Google's instruction-tuned model

### ⚙️ Advanced Settings (ChatGPT/Claude-like)

#### Model Parameters
- **Temperature** (0-2): Controls randomness and creativity
- **Max Tokens**: Maximum response length
- **Top P** (0-1): Nucleus sampling for token selection
- **Frequency Penalty** (-2 to 2): Reduces repetition
- **Presence Penalty** (-2 to 2): Encourages topic diversity

#### Behavior Configuration
- **System Prompts**: Custom instructions for AI personality and role
- **Context Window**: Number of previous messages to include
- **Project Context**: Automatically include relevant project data

#### Quick Presets
- **Balanced**: Good mix of creativity and precision
- **Precise**: Deterministic, focused responses
- **Creative**: Diverse, imaginative responses
- **Construction Expert**: Optimized for construction queries

### 📁 File & Storage Integration

#### Supported Storage Providers
- **Google Drive**: Upload and store files in Google Drive
- **OneDrive**: Microsoft OneDrive integration
- **Local File System**: Local storage for files
- **None**: Browser-only storage

#### File Upload Features
- Support for multiple file types (PDF, DOC, images, etc.)
- Max file size: 50MB
- Automatic file attachment to messages
- File preview in chat interface

## Setup Instructions

### 1. Get Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (it starts with `gsk_...`)

### 2. Configure Environment Variables

Create or update `.env.local` in the `frontend` directory:

```bash
# Groq API Configuration
VITE_GROQ_API_KEY=gsk_your_actual_api_key_here

# Backend API (if using custom backend)
VITE_API_BASE_URL=http://localhost:10000/api
```

### 3. Install Dependencies

```bash
cd frontend
npm install
```

### 4. Configure Your GPT ODD 120B Model

The chat interface is pre-configured with `gpt-odd-120b` as the custom model. To use your specific model:

1. Update the model ID in `frontend/src/types/chat.ts` if your model has a different identifier
2. Configure any custom parameters specific to your model deployment
3. Ensure your Groq account has access to the custom model

## Usage

### Basic Chat

1. Navigate to `/ai-chat` (protected) or `/demo/ai-chat` (public demo)
2. Type your message in the input field
3. Press Enter to send (Shift+Enter for new line)
4. View AI responses with metadata (model, tokens used)

### Configuring Settings

1. Click the **Settings** icon (⚙️) in the chat header
2. Navigate through tabs:
   - **Model**: Select AI model and apply presets
   - **Parameters**: Fine-tune temperature, tokens, penalties
   - **Behavior**: Set system prompts and context window
   - **Storage**: Configure file storage provider

3. Click **Save Settings** to persist changes

### Uploading Files

1. Click the **Paperclip** icon (📎) in the input area
2. Select a file (PDF, DOC, XLS, images, etc.)
3. File will be uploaded and attached to your next message
4. AI can reference the file content in its responses

### Storage Provider Setup

#### Google Drive
1. Select "Google Drive" in Settings > Storage
2. Click to authenticate (OAuth flow will open)
3. Grant necessary permissions
4. Files will be automatically saved to your Drive

#### OneDrive
1. Select "OneDrive" in Settings > Storage
2. Authenticate with Microsoft account
3. Choose storage location
4. Files sync automatically

#### Local Storage
1. Select "Local File System" in Settings > Storage
2. Choose a local directory
3. Files are stored on your machine

## API Integration

### Frontend Service

The `ChatService` (`frontend/src/services/chat.service.ts`) provides:

```typescript
// Send message to backend
await chatService.sendMessage({
  message: 'Your question',
  conversation_id: 'conv-123',
  settings: chatSettings,
  attachments: fileAttachments,
});

// Direct Groq API call (testing)
const response = await chatService.sendMessageToGroq(
  messages,
  settings
);

// Upload file
const result = await chatService.uploadFile({
  file: fileObject,
  storageProvider: 'google-drive',
});
```

### Backend Integration

To connect the frontend to your backend:

1. Create route: `/api/chat/message` (POST)
2. Accept `ChatRequest` payload
3. Call Groq API with user's settings
4. Return `ChatResponse` with AI message

Example backend endpoint (Express):

```typescript
app.post('/api/chat/message', async (req, res) => {
  const { message, settings, attachments } = req.body;
  
  // Call Groq API
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: message }],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      // ... other settings
    }),
  });
  
  const data = await response.json();
  
  res.json({
    message: {
      id: generateId(),
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: new Date(),
      metadata: {
        model: settings.model,
        tokens: data.usage.total_tokens,
      },
    },
    conversation_id: req.body.conversation_id,
  });
});
```

## Type Definitions

All types are defined in `frontend/src/types/chat.ts`:

- `ChatMessage`: Individual message structure
- `ChatSettings`: Configuration options
- `ChatRequest`/`ChatResponse`: API payloads
- `FileAttachment`: File upload metadata
- `GroqChatRequest`: Groq API format

## Model Configurations

### GPT ODD 120B
```typescript
{
  model: 'gpt-odd-120b',
  maxTokens: 8192,
  contextWindow: 32768,
  temperature: 0.7,
}
```

### Llama 3.3 70B
```typescript
{
  model: 'llama-3.3-70b-versatile',
  maxTokens: 8000,
  contextWindow: 32768,
  temperature: 0.7,
}
```

## Troubleshooting

### "Groq API key not configured"
- Ensure `VITE_GROQ_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key
- Verify the key starts with `gsk_`

### "Chat API error: 401 Unauthorized"
- Check if your Groq API key is valid
- Verify key has access to the model you're using
- Check if key has sufficient credits/quota

### File upload fails
- Ensure file is under 50MB
- Check storage provider is configured
- Verify authentication with storage provider

### Model not responding
- Check Groq API status: https://status.groq.com
- Verify your model ID matches Groq's model list
- Check browser console for detailed error messages

## Development

### Testing Locally

```bash
# Frontend
cd frontend
npm run dev

# Access chat at:
# http://localhost:5173/ai-chat (protected)
# http://localhost:5173/demo/ai-chat (public)
```

### Mock Mode

When backend/Groq is unavailable, the interface falls back to mock responses automatically. This allows development without API keys.

### Custom Model Integration

To add your own model:

1. Update `AVAILABLE_MODELS` in `frontend/src/types/chat.ts`
2. Add model configuration
3. Update Groq API call if needed

## Security Notes

- **Never commit `.env.local`** with real API keys
- API keys are only used client-side for demo
- Production should route through backend
- Implement rate limiting on backend
- Validate file uploads server-side
- Sanitize user inputs before sending to AI

## Support

For issues or questions:
- Check the [Groq Documentation](https://console.groq.com/docs)
- Review error messages in browser console
- Contact the development team

## License

This integration is part of the OC Pipeline project and follows the project's license terms.
