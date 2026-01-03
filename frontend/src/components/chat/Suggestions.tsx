/**
 * Suggestions Component
 * 
 * Displays suggested prompts or quick actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface SuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

export const Suggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  disabled = false,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">Suggested prompts:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSelectSuggestion(suggestion)}
                disabled={disabled}
                className="text-xs h-8 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
