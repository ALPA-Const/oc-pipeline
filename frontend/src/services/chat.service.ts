/**
 * AI Chat Service
 * 
 * Handles API communication for the AI chat interface.
 * Supports multiple providers: Groq, OpenAI, Anthropic, Ollama,
 * OpenWebUI (self-hosted), LibreChat (self-hosted), and custom endpoints.
 */

import {
  ChatMessage,
  ChatConversation,
  ChatRequest,
  ChatResponse,
  ChatSettings,
  DEFAULT_CHAT_SETTINGS,
  GroqChatRequest,
  GroqMessage,
  FileUploadRequest,
  FileUploadResponse,
  AIProvider,
  PROVIDER_DEFAULTS,
} from '@/types/chat';

class ChatService {
  private backendUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '');
  private groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';

  // ──────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Resolve the base API URL for a given provider, honoring any custom endpoint
   * stored in providerConfig (as configured by the user in ChatSettings).
   */
  private resolveProviderUrl(provider: AIProvider, settings: ChatSettings): string {
    const customUrl = settings.providerConfig?.baseUrl?.trim();
    if (customUrl) return customUrl;
    return PROVIDER_DEFAULTS[provider]?.defaultUrl ?? '';
  }

  /**
   * Resolve the API key for a given provider.  Priority:
   *   1. Per-conversation providerConfig.apiKey
   *   2. Env-var keys (VITE_GROQ_API_KEY, VITE_OPENAI_API_KEY, etc.)
   */
  private resolveApiKey(provider: AIProvider, settings: ChatSettings): string {
    const configKey = settings.providerConfig?.apiKey?.trim();
    if (configKey) return configKey;

    switch (provider) {
      case 'groq':
        return import.meta.env.VITE_GROQ_API_KEY || '';
      case 'openai':
        return import.meta.env.VITE_OPENAI_API_KEY || '';
      case 'anthropic':
        return import.meta.env.VITE_ANTHROPIC_API_KEY || '';
      default:
        return '';
    }
  }

  /**
   * Send a message using the OpenAI-compatible chat/completions endpoint.
   * Used by Groq, OpenAI, Ollama, OpenWebUI, LibreChat and any custom endpoint.
   */
  private async sendOpenAICompatible(
    messages: ChatMessage[],
    settings: ChatSettings
  ): Promise<ChatMessage> {
    const provider = settings.provider;
    const baseUrl = this.resolveProviderUrl(provider, settings);
    const apiKey = this.resolveApiKey(provider, settings);

    // Validate API key for providers that require one
    if (PROVIDER_DEFAULTS[provider]?.apiKeyRequired && !apiKey) {
      throw new Error(`${PROVIDER_DEFAULTS[provider].label} API key not configured`);
    }

    const groqMessages: GroqMessage[] = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    if (settings.systemPrompt) {
      groqMessages.unshift({ role: 'system', content: settings.systemPrompt });
    }

    const requestBody: GroqChatRequest = {
      model: settings.model,
      messages: groqMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      frequency_penalty: settings.frequencyPenalty,
      presence_penalty: settings.presencePenalty,
      stop: settings.stopSequences,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Use statusText only to avoid leaking raw API error bodies that may contain
      // sensitive data.  Full details are logged to the console for debugging.
      const errBody = await response.text();
      console.error(`${PROVIDER_DEFAULTS[provider]?.label ?? provider} API error body:`, errBody);
      throw new Error(`${PROVIDER_DEFAULTS[provider]?.label ?? provider} API error: ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: choice.message.content,
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        model: settings.model,
        tokens: data.usage?.total_tokens,
      },
    };
  }

  /**
   * Send a message to the Anthropic Messages API.
   * Anthropic uses a different request/response format from OpenAI.
   */
  private async sendAnthropic(
    messages: ChatMessage[],
    settings: ChatSettings
  ): Promise<ChatMessage> {
    const baseUrl = this.resolveProviderUrl('anthropic', settings);
    const apiKey = this.resolveApiKey('anthropic', settings);

    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropicMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const body: Record<string, unknown> = {
      model: settings.model,
      max_tokens: settings.maxTokens,
      messages: anthropicMessages,
    };

    if (settings.systemPrompt) {
      body['system'] = settings.systemPrompt;
    }

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error body:', errBody);
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? '';

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      status: 'delivered',
      metadata: {
        model: settings.model,
        tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Send a message to the AI chat.
   * First tries the backend proxy; if unavailable falls back to direct provider
   * calls (useful in demo / dev environments).
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.backendUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.groqApiKey ? `Bearer ${this.groqApiKey}` : '',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      // Return mock response for demo purposes when backend is unavailable
      return this.getMockResponse(request);
    }
  }

  /**
   * Send a message directly to the configured provider (bypasses the backend
   * proxy).  Supports Groq, OpenAI, Anthropic, Ollama, OpenWebUI, LibreChat,
   * and any custom OpenAI-compatible endpoint.
   */
  async sendMessageToProvider(
    messages: ChatMessage[],
    settings: ChatSettings = DEFAULT_CHAT_SETTINGS
  ): Promise<ChatMessage> {
    const provider = settings.provider ?? 'groq';

    if (provider === 'anthropic') {
      return this.sendAnthropic(messages, settings);
    }

    // All other providers use the OpenAI-compatible chat/completions endpoint:
    // groq | openai | ollama | openwebui | librechat | custom
    return this.sendOpenAICompatible(messages, settings);
  }

  /**
   * @deprecated Use sendMessageToProvider() instead.
   * Kept for backwards compatibility with existing callers.
   */
  async sendMessageToGroq(
    messages: ChatMessage[],
    settings: ChatSettings = DEFAULT_CHAT_SETTINGS
  ): Promise<ChatMessage> {
    return this.sendMessageToProvider(messages, { ...settings, provider: 'groq' });
  }

  /**
   * Get chat conversation history
   */
  async getConversation(conversationId: string): Promise<ChatConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return this.getMockConversation(conversationId);
    }
  }

  /**
   * Get list of conversations
   */
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string, settings?: ChatSettings): Promise<ChatConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, settings }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      return this.getMockConversation(Date.now().toString(), settings);
    }
  }

  /**
   * Update conversation settings
   */
  async updateConversationSettings(
    conversationId: string,
    settings: ChatSettings
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/chat/conversations/${conversationId}/settings`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settings }),
        }
      );

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating conversation settings:', error);
      // Silently fail for demo mode
    }
  }

  /**
   * Upload file for chat integration
   */
  async uploadFile(request: FileUploadRequest): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.storageProvider) {
      formData.append('storageProvider', request.storageProvider);
    }
    if (request.conversationId) {
      formData.append('conversationId', request.conversationId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        attachment: {
          id: '',
          name: request.file.name,
          size: request.file.size,
          type: request.file.type,
          url: '',
          uploadedAt: new Date(),
        },
      };
    }
  }

  /**
   * Mock response for demo purposes
   */
  private getMockResponse(request: ChatRequest): ChatResponse {
    const aiResponses = [
      "I can help you with that! Let me analyze your construction project data...",
      "Based on the pipeline information, here are my insights:",
      "I've reviewed the project specifications. Would you like me to provide recommendations?",
      "Let me break that down for you with some specific details from your data...",
      "Great question! Here's what I found in your construction management system:",
    ];

    const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    const settings = request.settings || DEFAULT_CHAT_SETTINGS;

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
        status: 'delivered',
        metadata: {
          model: settings.model,
          tokens: 150,
        },
      },
      conversation_id: request.conversation_id || `conv-${Date.now()}`,
      suggestions: [
        'Tell me more about project risks',
        'Analyze the pipeline metrics',
        'Show me recent changes',
      ],
    };
  }

  /**
   * Mock conversation for demo purposes
   */
  private getMockConversation(
    conversationId: string,
    settings?: ChatSettings
  ): ChatConversation {
    return {
      id: conversationId,
      title: 'New Conversation',
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
      settings: settings || DEFAULT_CHAT_SETTINGS,
    };
  }
}

export const chatService = new ChatService();
