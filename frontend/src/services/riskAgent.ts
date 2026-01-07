// frontend/src/services/riskAgent.ts

export interface RiskItem {
  id: string;
  category: string;
  title: string;
  description: string;
  likelihood: string; // "Low" | "Medium" | "High" | "Critical"
  impact: string; // same scale as above
  phase: string; // "Preconstruction" | "Construction" | "Closeout" | etc.
  mitigation: string;
}

export interface RiskAgentResponse {
  analysis_markdown: string;
  risks: RiskItem[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

/**
 * Call the backend Risk Agent
 * @param params.question - user question
 * @param params.projectId - optional project id / context
 */
export async function askRiskAgent(params: {
  question: string;
  projectId?: string;
}): Promise<RiskAgentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/risk-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Risk Agent request failed (${response.status}): ${text || "no details"}`
    );
  }

  const data = await response.json();

  // Normalize in case backend falls back to text-only
  return {
    analysis_markdown: data.analysis_markdown ?? data.answer ?? "",
    risks: Array.isArray(data.risks) ? data.risks : [],
  };
}
