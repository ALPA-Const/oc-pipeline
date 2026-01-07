// =====================================================
// OEOC AI Chat - Claude Integration
// Interactive chat interface with ATLAS AI
// =====================================================

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  User,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { claudeService, type ChatMessage } from "@/services/claude.service";

interface Message extends ChatMessage {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "healthy" | "error">(
    "checking"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkApiHealth = async () => {
    setApiStatus("checking");
    const health = await claudeService.checkHealth();
    setApiStatus(health.success ? "healthy" : "error");
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get conversation history for context
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let fullResponse = "";

      await claudeService.streamMessage(
        userMessage.content,
        history,
        { module: "OEOC Command Center" },
        (chunk) => {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: fullResponse } : m
            )
          );
        },
        (usage) => {
          setTotalTokens((prev) => ({
            input: prev.input + usage.inputTokens,
            output: prev.output + usage.outputTokens,
          }));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, isStreaming: false } : m
            )
          );
        }
      );
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: "",
                isStreaming: false,
                error: error.message || "Failed to get response",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setTotalTokens({ input: 0, output: 0 });
  };

  const suggestedPrompts = [
    "What are the key metrics I should track for a federal construction project?",
    "Help me understand the TRIR and DART safety calculations",
    "What documents are required for project closeout?",
    "Explain the change order approval workflow",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">ATLAS AI Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Powered by Claude • Construction Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={apiStatus === "healthy" ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {apiStatus === "checking" ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : apiStatus === "healthy" ? (
              <Zap className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {apiStatus === "checking"
              ? "Connecting..."
              : apiStatus === "healthy"
              ? "Online"
              : "Offline"}
          </Badge>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Bot className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Welcome to ATLAS AI</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                I'm your construction management assistant. Ask me about project
                management, federal contracting, safety metrics, cost analysis,
                and more.
              </p>
              <div className="grid gap-2 w-full max-w-lg">
                <p className="text-xs text-muted-foreground mb-2">
                  Try asking:
                </p>
                {suggestedPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3"
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-2 shrink-0" />
                    <span className="truncate">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.error ? (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{message.error}</span>
                      </div>
                    ) : (
                      <>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                          )}
                        </div>
                        {message.role === "assistant" && message.content && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() =>
                                handleCopy(message.content, message.id)
                              }
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedId === message.id ? "Copied" : "Copy"}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Token Counter */}
        {(totalTokens.input > 0 || totalTokens.output > 0) && (
          <div className="px-4 py-1 border-t bg-muted/30 text-xs text-muted-foreground flex justify-end gap-4">
            <span>Input: {totalTokens.input.toLocaleString()} tokens</span>
            <span>Output: {totalTokens.output.toLocaleString()} tokens</span>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ATLAS anything about construction management..."
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading || apiStatus !== "healthy"}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || apiStatus !== "healthy"}
              className="shrink-0"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AIChat;
