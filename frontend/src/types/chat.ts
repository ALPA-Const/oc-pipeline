/**
 * AI Chat Interface Types
 * 
 * Type definitions for the elite AI chat interface
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
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  context?: {
    project_id?: string;
    module?: string;
    additional_data?: Record<string, unknown>;
  };
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
