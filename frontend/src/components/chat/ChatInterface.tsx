/**
 * Chat Interface Component
 * 
 * Main chat interface with message display, input, and suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { Suggestions } from './Suggestions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { Sparkles, MessageSquare } from 'lucide-react';

// Constants
const AI_RESPONSE_DELAY = 500; // ms - delay before showing AI response for natural feel

interface ChatInterfaceProps {
  conversationId?: string;
  className?: string;
  showHeader?: boolean;
  context?: {
    project_id?: string;
    module?: string;
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  className,
  showHeader = true,
  context,
}) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Analyze pipeline metrics',
    'Show project risks',
    'Generate progress report',
  ]);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load conversation history if conversationId provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    try {
      const conversation = await chatService.getConversation(convId);
      setMessages(conversation.messages);
      setCurrentConversationId(convId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setSuggestions([]);

    try {
      // Send to API
      const response = await chatService.sendMessage({
        message: content,
        conversation_id: currentConversationId,
        context,
      });

      // Update user message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
        )
      );

      // Add AI response after a brief delay for natural feel
      setTimeout(() => {
        setMessages((prev) => [...prev, response.message]);
        setIsTyping(false);

        // Update suggestions
        if (response.suggestions) {
          setSuggestions(response.suggestions);
        }

        // Update conversation ID if new
        if (response.conversation_id) {
          setCurrentConversationId(response.conversation_id);
        }
      }, AI_RESPONSE_DELAY);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );
      setIsTyping(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Empty state
  const isEmpty = messages.length === 0;

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      {showHeader && (
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">
                  Your construction management copilot
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="container mx-auto max-w-4xl px-4 py-6">
            {isEmpty ? (
              // Welcome Screen
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 mb-6">
                  <MessageSquare className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Welcome to AI Chat</h3>
                <p className="text-muted-foreground max-w-md mb-8">
                  Ask me anything about your construction projects, pipeline metrics, risk
                  analysis, or get insights from your data.
                </p>
                <div className="w-full max-w-md">
                  <Suggestions
                    suggestions={suggestions}
                    onSelectSuggestion={handleSelectSuggestion}
                    disabled={isTyping}
                  />
                </div>
              </div>
            ) : (
              // Messages
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Suggestions (when messages exist) */}
        {!isEmpty && suggestions.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8">
            <Suggestions
              suggestions={suggestions}
              onSelectSuggestion={handleSelectSuggestion}
              disabled={isTyping}
            />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isTyping}
        placeholder={
          context?.project_id
            ? 'Ask about this project...'
            : 'Ask me anything about your construction projects...'
        }
      />
    </div>
  );
};
