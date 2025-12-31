/**
 * Chat Message Component
 * 
 * Displays individual chat messages with styling based on role
 */

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Clock } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-6 animate-in fade-in-50 slide-in-from-bottom-3 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'h-10 w-10 shrink-0',
        isUser ? 'bg-primary' : 'bg-gradient-to-br from-blue-500 to-purple-600'
      )}>
        <AvatarFallback className="bg-transparent text-white">
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-2 max-w-[70%]', isUser && 'items-end')}>
        {/* Message Bubble */}
        <div
          className={cn(
            'px-4 py-3 rounded-2xl shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border rounded-tl-sm'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Metadata */}
        <div className={cn('flex items-center gap-2 text-xs text-muted-foreground px-2')}>
          <Clock className="h-3 w-3" />
          <span>{formatTime(message.timestamp)}</span>
          {message.metadata?.model && !isUser && (
            <>
              <span>•</span>
              <span className="text-xs">{message.metadata.model}</span>
            </>
          )}
          {message.status === 'sending' && (
            <>
              <span>•</span>
              <span className="text-xs">Sending...</span>
            </>
          )}
          {message.status === 'error' && (
            <>
              <span>•</span>
              <span className="text-xs text-destructive">Failed</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
