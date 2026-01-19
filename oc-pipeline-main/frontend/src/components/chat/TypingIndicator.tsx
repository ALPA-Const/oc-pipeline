/**
 * Typing Indicator Component
 * 
 * Shows animated typing indicator when AI is responding
 */

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-6 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
        <AvatarFallback className="bg-transparent text-white">
          <Bot className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>

      {/* Typing Animation */}
      <div className="flex items-center px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1">
          <div
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <div
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
          />
          <div
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    </div>
  );
};
