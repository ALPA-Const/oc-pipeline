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

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  provider: 'groq' | 'openai' | 'custom';
}

export interface ChatSettings {
  // Model Configuration
  model: GroqModel;
  temperature: number; // 0-2, controls randomness
  maxTokens: number; // Maximum tokens to generate
  topP: number; // 0-1, nucleus sampling
  frequencyPenalty: number; // -2 to 2, penalize frequent tokens
  presencePenalty: number; // -2 to 2, penalize repeated topics
  
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
  model: GroqModel;
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
  {
    id: 'gpt-odd-120b',
    name: 'GPT ODD 120B',
    description: 'Custom 120B parameter model optimized for construction domain',
    maxTokens: 8192,
    contextWindow: 32768,
    provider: 'custom',
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
];

