// =====================================================
// Claude AI Service - Frontend
// API client for Claude chat integration
// =====================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface ChatContext {
  projectId?: string;
  module?: string;
  additionalContext?: string;
}

export interface ChatResponse {
  message: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Send a chat message to Claude API
 */
export async function sendMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  context?: ChatContext
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/claude/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversationHistory: conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      context,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Stream a chat response from Claude API
 */
export async function streamMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  context?: ChatContext,
  onChunk: (chunk: string) => void = () => {},
  onComplete: (usage: {
    inputTokens: number;
    outputTokens: number;
  }) => void = () => {}
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/claude/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversationHistory: conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      context,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to stream message");
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No reader available");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "chunk") {
            onChunk(data.content);
          } else if (data.type === "complete") {
            onComplete(data.usage);
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
}

/**
 * Analyze a document using Claude
 */
export async function analyzeDocument(
  content: string,
  docType: string
): Promise<{
  summary: string;
  keyDates: string[];
  keyValues: string[];
  recommendations: string[];
}> {
  const response = await fetch(`${API_BASE}/api/claude/analyze-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, docType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze document");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get risk assessment for a project
 */
export async function assessRisk(
  projectData: Record<string, unknown>
): Promise<{
  overallRisk: "low" | "medium" | "high";
  factors: Array<{ factor: string; impact: string; mitigation: string }>;
  recommendations: string[];
}> {
  const response = await fetch(`${API_BASE}/api/claude/assess-risk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assess risk");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Check Claude API health status
 */
export async function checkHealth(): Promise<{
  success: boolean;
  status: string;
  model?: string;
  message?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/api/claude/health`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      status: "unreachable",
      message: "Could not connect to API",
    };
  }
}

export const claudeService = {
  sendMessage,
  streamMessage,
  analyzeDocument,
  assessRisk,
  checkHealth,
};

export default claudeService;
