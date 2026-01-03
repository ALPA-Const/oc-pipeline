/**
 * AI Chat Service
 * 
 * Handles API communication for the AI chat interface with Groq integration
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
} from '@/types/chat';

class ChatService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '');
  private groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';

  /**
   * Send a message to the AI chat with Groq integration
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/message`, {
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
   * Send a message directly to Groq API (for testing/demo)
   */
  async sendMessageToGroq(
    messages: ChatMessage[],
    settings: ChatSettings = DEFAULT_CHAT_SETTINGS
  ): Promise<ChatMessage> {
    if (!this.groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const groqMessages: GroqMessage[] = messages.map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // Add system prompt if provided
    if (settings.systemPrompt) {
      groqMessages.unshift({
        role: 'system',
        content: settings.systemPrompt,
      });
    }

    const groqRequest: GroqChatRequest = {
      model: settings.model,
      messages: groqMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      top_p: settings.topP,
      frequency_penalty: settings.frequencyPenalty,
      presence_penalty: settings.presencePenalty,
      stop: settings.stopSequences,
    };

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify(groqRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.message || response.statusText}`);
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
          tokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw error;
    }
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
