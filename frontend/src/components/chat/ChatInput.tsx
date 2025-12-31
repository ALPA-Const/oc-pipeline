/**
 * Chat Input Component
 * 
 * Input field for sending chat messages with advanced features
 */

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Ask me anything about your construction projects...',
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-4xl p-4">
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'min-h-[52px] max-h-[200px] resize-none pr-12',
                'focus-visible:ring-2 focus-visible:ring-primary'
              )}
              rows={1}
            />
            {/* Voice Input Button (positioned inside textarea) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8"
              disabled={disabled}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          {/* Send Button */}
          <Button
            type="button"
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            className={cn(
              'h-10 w-10 shrink-0 transition-all',
              message.trim() && !disabled
                ? 'bg-primary hover:bg-primary/90'
                : 'opacity-50'
            )}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
