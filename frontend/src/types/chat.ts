/**
 * AI Chat Interface Types
 * 
 * Type definitions for the elite AI chat interface with Groq integration
 */

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error' | 'delivered';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  metadata?: {
    tokens?: number;
    model?: string;
    context?: string;
    attachments?: FileAttachment[];
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
  metadata?: {
    project_id?: string;
    context_type?: string;
  };
  settings?: ChatSettings;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  context?: {
    project_id?: string;
    module?: string;
    additional_data?: Record<string, unknown>;
  };
  settings?: ChatSettings;
  attachments?: FileAttachment[];
}

export interface ChatResponse {
  message: ChatMessage;
  conversation_id: string;
  suggestions?: string[];
}

export interface TypingIndicator {
  isTyping: boolean;
  user?: string;
}

// =====================================================
// GROQ & MODEL CONFIGURATION
// =====================================================

export type GroqModel = 
  | 'gpt-odd-120b' // Custom GPT ODD 120B model
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-8b-instant'
  | 'mixtral-8x7b-32768'
  | 'gemma-7b-it';

// =====================================================
// MULTI-PROVIDER SUPPORT
// Platforms similar to OpenWebUI and LibreChat
// =====================================================

export type AIProvider =
  | 'groq'       // Groq fast inference (default)
  | 'openai'     // OpenAI direct API
  | 'anthropic'  // Anthropic Claude
  | 'ollama'     // Ollama local LLM server (used by OpenWebUI)
  | 'openwebui'  // OpenWebUI self-hosted interface (Ollama-compatible)
  | 'librechat'  // LibreChat multi-provider platform (OpenAI-compatible)
  | 'custom';    // Any OpenAI-compatible endpoint

export type AnyModel = GroqModel | string;

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  provider: AIProvider;
}

export interface ProviderConfig {
  /** Base URL for the provider's API endpoint */
  baseUrl?: string;
  /** API key for the provider */
  apiKey?: string;
}

export interface ChatSettings {
  // Model Configuration
  model: AnyModel;
  temperature: number; // 0-2, controls randomness
  maxTokens: number; // Maximum tokens to generate
  topP: number; // 0-1, nucleus sampling
  frequencyPenalty: number; // -2 to 2, penalize frequent tokens
  presencePenalty: number; // -2 to 2, penalize repeated topics

  // Provider Selection (OpenWebUI / LibreChat / Ollama / etc.)
  provider: AIProvider;
  providerConfig?: ProviderConfig;
  
  // System Behavior
  systemPrompt?: string; // Custom system instructions
  stopSequences?: string[]; // Stop generation at these sequences
  
  // Context Management
  contextWindow: number; // Number of messages to include in context
  includeSystemContext: boolean; // Include project/module context
  
  // Storage & Integration
  storageProvider?: StorageProvider;
  autoSaveConversations: boolean;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  model: 'gpt-odd-120b',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  provider: 'groq',
  contextWindow: 10,
  includeSystemContext: true,
  autoSaveConversations: true,
};

// =====================================================
// FILE & STORAGE INTEGRATION
// =====================================================

export type StorageProvider = 'google-drive' | 'onedrive' | 'local' | 'none';

export interface StorageConfig {
  provider: StorageProvider;
  accessToken?: string;
  refreshToken?: string;
  folderId?: string;
  folderPath?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storageProvider?: StorageProvider;
  uploadedAt: Date;
}

export interface FileUploadRequest {
  file: File;
  storageProvider?: StorageProvider;
  conversationId?: string;
}

export interface FileUploadResponse {
  attachment: FileAttachment;
  success: boolean;
  error?: string;
}

// =====================================================
// GROQ API TYPES
// =====================================================

export interface GroqChatRequest {
  model: AnyModel;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GroqChoice {
  index: number;
  message: GroqMessage;
  finish_reason: string;
}

// =====================================================
// PROVIDER DEFAULT ENDPOINTS
// =====================================================

export const PROVIDER_DEFAULTS: Record<AIProvider, { label: string; defaultUrl: string; apiKeyRequired: boolean }> = {
  groq: {
    label: 'Groq',
    defaultUrl: 'https://api.groq.com/openai/v1',
    apiKeyRequired: true,
  },
  openai: {
    label: 'OpenAI',
    defaultUrl: 'https://api.openai.com/v1',
    apiKeyRequired: true,
  },
  anthropic: {
    label: 'Anthropic',
    defaultUrl: 'https://api.anthropic.com/v1',
    apiKeyRequired: true,
  },
  ollama: {
    label: 'Ollama (local)',
    defaultUrl: 'http://localhost:11434/v1',
    apiKeyRequired: false,
  },
  openwebui: {
    label: 'OpenWebUI (self-hosted)',
    defaultUrl: 'http://localhost:3000/ollama/v1',
    apiKeyRequired: false,
  },
  librechat: {
    label: 'LibreChat (self-hosted)',
    defaultUrl: 'http://localhost:3080/api',
    apiKeyRequired: false,
  },
  custom: {
    label: 'Custom Endpoint',
    defaultUrl: '',
    apiKeyRequired: false,
  },
};

// =====================================================
// SETTINGS PRESETS
// =====================================================

export interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<ChatSettings>;
}

export const SETTINGS_PRESETS: SettingsPreset[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance between creativity and precision',
    settings: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
  {
    id: 'precise',
    name: 'Precise',
    description: 'More deterministic and focused responses',
    settings: {
      temperature: 0.3,
      topP: 0.9,
      frequencyPenalty: 0.2,
      presencePenalty: 0,
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'More diverse and creative responses',
    settings: {
      temperature: 1.2,
      topP: 1,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
    },
  },
  {
    id: 'construction-expert',
    name: 'Construction Expert',
    description: 'Optimized for construction management queries',
    settings: {
      temperature: 0.5,
      topP: 0.95,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      systemPrompt: 'You are an expert construction management AI assistant specializing in pipeline management, project estimation, risk analysis, and regulatory compliance.',
    },
  },
];

// =====================================================
// AVAILABLE MODELS
// =====================================================

export const AVAILABLE_MODELS: ModelConfig[] = [
  // ── Groq ─────────────────────────────────────────────────────────────────
  {
    id: 'gpt-odd-120b',
    name: 'GPT ODD 120B',
    description: 'Custom 120B parameter model optimized for construction domain',
    maxTokens: 8192,
    contextWindow: 32768,
    provider: 'groq',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    description: 'Meta\'s latest Llama model with improved reasoning',
    maxTokens: 8000,
    contextWindow: 32768,
    provider: 'groq',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Fast and efficient for quick responses',
    maxTokens: 8000,
    contextWindow: 8192,
    provider: 'groq',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    description: 'Mixture of experts model with strong performance',
    maxTokens: 32768,
    contextWindow: 32768,
    provider: 'groq',
  },
  {
    id: 'gemma-7b-it',
    name: 'Gemma 7B IT',
    description: 'Google\'s instruction-tuned model',
    maxTokens: 8192,
    contextWindow: 8192,
    provider: 'groq',
  },
  // ── OpenAI ───────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'OpenAI\'s most capable multimodal model',
    maxTokens: 16384,
    contextWindow: 128000,
    provider: 'openai',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Lightweight and cost-efficient GPT-4o variant',
    maxTokens: 16384,
    contextWindow: 128000,
    provider: 'openai',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and affordable OpenAI chat model',
    maxTokens: 4096,
    contextWindow: 16385,
    provider: 'openai',
  },
  // ── Anthropic ────────────────────────────────────────────────────────────
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic\'s most intelligent model for complex tasks',
    maxTokens: 8192,
    contextWindow: 200000,
    provider: 'anthropic',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Anthropic\'s fastest and most compact model',
    maxTokens: 8192,
    contextWindow: 200000,
    provider: 'anthropic',
  },
  // ── Ollama / OpenWebUI ───────────────────────────────────────────────────
  // Ollama is the local LLM server powering OpenWebUI.
  // Models below are pulled via `ollama pull <name>`.
  {
    id: 'llama3.2',
    name: 'Llama 3.2 (Ollama)',
    description: 'Meta Llama 3.2 running locally via Ollama / OpenWebUI',
    maxTokens: 8192,
    contextWindow: 128000,
    provider: 'ollama',
  },
  {
    id: 'llama3.1',
    name: 'Llama 3.1 (Ollama)',
    description: 'Meta Llama 3.1 running locally via Ollama / OpenWebUI',
    maxTokens: 8192,
    contextWindow: 128000,
    provider: 'ollama',
  },
  {
    id: 'mistral',
    name: 'Mistral (Ollama)',
    description: 'Mistral 7B running locally via Ollama / OpenWebUI',
    maxTokens: 8192,
    contextWindow: 32768,
    provider: 'ollama',
  },
  {
    id: 'codellama',
    name: 'Code Llama (Ollama)',
    description: 'Meta\'s code-specialized Llama model via Ollama',
    maxTokens: 4096,
    contextWindow: 16384,
    provider: 'ollama',
  },
  // ── OpenWebUI ────────────────────────────────────────────────────────────
  // OpenWebUI exposes an OpenAI-compatible API and can serve any Ollama model.
  // Configure the endpoint URL in Provider Settings (default: http://localhost:3000).
  {
    id: 'openwebui-default',
    name: 'OpenWebUI Default Model',
    description: 'Active model in your self-hosted OpenWebUI instance',
    maxTokens: 8192,
    contextWindow: 32768,
    provider: 'openwebui',
  },
  // ── LibreChat ────────────────────────────────────────────────────────────
  // LibreChat exposes an OpenAI-compatible /api/ask endpoint.
  // Configure the endpoint URL in Provider Settings (default: http://localhost:3080).
  {
    id: 'librechat-default',
    name: 'LibreChat Default Model',
    description: 'Active model in your self-hosted LibreChat instance',
    maxTokens: 8192,
    contextWindow: 32768,
    provider: 'librechat',
  },
];

