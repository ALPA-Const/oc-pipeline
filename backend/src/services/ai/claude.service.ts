// =====================================================
// Claude AI Service
// Integrates Anthropic Claude API into OC Pipeline
// =====================================================

import Anthropic from "@anthropic-ai/sdk";

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// System prompt for OC Pipeline context
const OC_PIPELINE_SYSTEM_PROMPT = `You are ATLAS, the AI assistant for OC Pipeline - a federal-grade construction management platform for O'Neill Contractors.

You have expertise in:
- Federal construction projects (NIST 800-171, SOC 2, FISMA compliant)
- Preconstruction: bids, estimates, pursuits, pipeline management
- Cost management: budgets, change orders, forecasts
- Schedule management: Gantt charts, critical path, milestones
- Risk management: risk register, mitigation strategies
- Quality management: inspections, punch lists, NCRs
- Safety: OSHA compliance, TRIR, DART, EMR metrics
- Procurement: vendors, contracts, subcontracts
- Communications: RFIs, submittals, daily reports
- Project closeout: warranties, as-builts, handover

You help users:
1. Navigate and understand the platform
2. Analyze project data and provide insights
3. Generate reports and recommendations
4. Answer questions about construction management best practices
5. Assist with federal contracting requirements (8(a), SDVOSB, HUBZone, etc.)

Be concise, professional, and construction-industry focused. When uncertain, ask clarifying questions rather than guessing.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: {
    projectId?: string;
    module?: string;
    additionalContext?: string;
  };
}

export interface ChatResponse {
  message: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Send a message to Claude and get a response
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const { message, conversationHistory = [], context } = request;

  // Build system prompt with optional context
  let systemPrompt = OC_PIPELINE_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += "\n\n--- Current Context ---";
    if (context.projectId) {
      systemPrompt += `\nActive Project ID: ${context.projectId}`;
    }
    if (context.module) {
      systemPrompt += `\nCurrent Module: ${context.module}`;
    }
    if (context.additionalContext) {
      systemPrompt += `\n${context.additionalContext}`;
    }
  }

  // Build messages array
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    const responseText =
      textContent && textContent.type === "text"
        ? textContent.text
        : "No response generated.";

    return {
      message: responseText,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error: any) {
    console.error("Claude API Error:", error);
    throw new Error(error.message || "Failed to communicate with Claude");
  }
}

/**
 * Stream a response from Claude (for real-time UI updates)
 */
export async function streamChat(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: (usage: { inputTokens: number; outputTokens: number }) => void
): Promise<void> {
  const { message, conversationHistory = [], context } = request;

  let systemPrompt = OC_PIPELINE_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += "\n\n--- Current Context ---";
    if (context.projectId) {
      systemPrompt += `\nActive Project ID: ${context.projectId}`;
    }
    if (context.module) {
      systemPrompt += `\nCurrent Module: ${context.module}`;
    }
    if (context.additionalContext) {
      systemPrompt += `\n${context.additionalContext}`;
    }
  }

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        onChunk(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();
    onComplete({
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    });
  } catch (error: any) {
    console.error("Claude Streaming Error:", error);
    throw new Error(error.message || "Failed to stream from Claude");
  }
}

/**
 * Analyze a document and extract key information
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
  const prompt = `Analyze this ${docType} document and extract:
1. A brief summary (2-3 sentences)
2. Key dates mentioned
3. Key monetary values
4. Recommendations or action items

Document content:
${content}

Respond in JSON format with keys: summary, keyDates, keyValues, recommendations`;

  const response = await chat({ message: prompt });

  try {
    return JSON.parse(response.message);
  } catch {
    return {
      summary: response.message,
      keyDates: [],
      keyValues: [],
      recommendations: [],
    };
  }
}

/**
 * Generate a risk assessment for a project
 */
export async function assessRisk(projectData: Record<string, any>): Promise<{
  overallRisk: "low" | "medium" | "high";
  factors: Array<{ factor: string; impact: string; mitigation: string }>;
  recommendations: string[];
}> {
  const prompt = `As a construction project risk analyst, assess the risk for this project:

${JSON.stringify(projectData, null, 2)}

Provide:
1. Overall risk level (low/medium/high)
2. Top 5 risk factors with impact and mitigation strategies
3. 3-5 recommendations

Respond in JSON format with keys: overallRisk, factors (array of {factor, impact, mitigation}), recommendations`;

  const response = await chat({ message: prompt });

  try {
    return JSON.parse(response.message);
  } catch {
    return {
      overallRisk: "medium",
      factors: [],
      recommendations: [response.message],
    };
  }
}

export const claudeService = {
  chat,
  streamChat,
  analyzeDocument,
  assessRisk,
};

export default claudeService;
