/**
 * Chat Input Component
 * 
 * Input field for sending chat messages with file upload support
 */

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Mic, X } from 'lucide-react';
import { FileAttachment } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload?: (files: FileList) => void;
  disabled?: boolean;
  placeholder?: string;
  attachments?: FileAttachment[];
  onRemoveAttachment?: (attachmentId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onFileUpload,
  disabled = false,
  placeholder = 'Ask me anything about your construction projects...',
  attachments = [],
  onRemoveAttachment,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(e.target.files);
      // Reset file input
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-4xl p-4">
        {/* File Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
              >
                <Paperclip className="h-4 w-4" />
                <span className="font-medium truncate max-w-[200px]">{attachment.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatFileSize(attachment.size)}
                </span>
                {onRemoveAttachment && (
                  <button
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="ml-1 hover:bg-background rounded-sm p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
          />

          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={disabled}
            onClick={handleFileClick}
            title="Upload file"
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
              title="Voice input (coming soon)"
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
              message.trim() && !disabled ? 'bg-primary hover:bg-primary/90' : 'opacity-50'
            )}
            size="icon"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
          {onFileUpload && ' • Click 📎 to attach files (PDF, DOC, images, etc.)'}
        </p>
      </div>
    </div>
  );
};
