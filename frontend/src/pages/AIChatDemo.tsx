/**
 * AI Chat Demo Page
 * 
 * Standalone demo of the elite AI chat interface (no authentication required)
 */

import React from 'react';
import { ChatInterface } from '@/components/chat';

export const AIChatDemo: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Elite header with glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10 container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Elite AI Assistant
          </h1>
          <p className="text-white/90 text-lg">
            Powered by advanced AI for intelligent construction management insights
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface showHeader={false} />
      </div>
    </div>
  );
};
