/**
 * AI Chat Service
 * 
 * Handles API communication for the AI chat interface
 */

import { ChatMessage, ChatConversation, ChatRequest, ChatResponse } from '@/types/chat';

class ChatService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '');

  /**
   * Send a message to the AI chat
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      // Return mock response for demo purposes
      return this.getMockResponse(request);
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
  async createConversation(title: string): Promise<ChatConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      return this.getMockConversation(Date.now().toString());
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

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
        status: 'delivered',
        metadata: {
          model: 'gpt-4',
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
  private getMockConversation(conversationId: string): ChatConversation {
    return {
      id: conversationId,
      title: 'New Conversation',
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}

export const chatService = new ChatService();
