// backend/src/routes/riskAgentRoutes.ts
import { Router, Request, Response } from "express";
import { aiClient } from "../services/aiClient";

const router = Router();

// -------------------- Types --------------------

type RiskItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High" | "Critical";
  phase: "Preconstruction" | "Construction" | "Closeout";
  mitigation: string;
};

type RiskAgentPayload = {
  question: string;
  projectId?: string;
};

type RiskAgentResponse = {
  analysis_markdown: string;
  risks: RiskItem[];
};

// -------------------- Route --------------------

/**
 * POST /api/ai/risk-agent
 * Body:  { question: string; projectId?: string }
 * Returns: RiskAgentResponse
 */
router.post(
  "/risk-agent",
  async (req: Request<unknown, unknown, RiskAgentPayload>, res: Response) => {
    try {
      const { question, projectId } = req.body ?? {};

      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "question is required" });
      }

      const systemPrompt = `
You are the ON Pipeline Risk & Preconstruction Agent for a federal
construction contractor (VA, NAVFAC, USACE, GSA).

Your job:
- Identify construction, schedule, safety, quality, logistics, environmental, and commercial risks.
- Think like a senior preconstruction executive and scheduler.
- Output MUST be valid JSON that a TypeScript API can parse.

You MUST respond as a SINGLE JSON object with this exact shape:

{
  "analysis_markdown": "High-level narrative risk analysis in Markdown, 6–12 bullet points.",
  "risks": [
    {
      "id": "R-001",
      "category": "Schedule | Safety | Cost | Quality | Logistics | Design | Commercial | Environmental",
      "title": "Short risk title",
      "description": "2–4 sentence description of the risk.",
      "likelihood": "Low | Medium | High",
      "impact": "Low | Medium | High | Critical",
      "phase": "Preconstruction | Construction | Closeout",
      "mitigation": "2–4 sentence practical mitigation plan."
    }
  ]
}

Rules:
- FIRST character of your response must be '{'.
- LAST character of your response must be '}'.
- NO backticks. NO Markdown code fences. NO extra commentary.
- If you cannot populate some fields, still return them as strings, not null.
`.trim();

      const userPrompt = `
${projectId ? `Project ID or context: ${projectId}\n` : ""}User question:
${question}

Return ONLY the JSON object described above. Do not include any explanation.
`.trim();

      const completion = await aiClient.chat.completions.create({
        model: "moonshotai/kimi-k2-thinking",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        // keep token usage under control to avoid credit/max_token errors
        max_tokens: 2048,
        // some OpenRouter setups ignore this, but keep it where supported
        // @ts-ignore
        response_format: { type: "json_object" },
      });

      const rawContent = completion.choices[0]?.message?.content?.trim() ?? "";

      if (!rawContent) {
        return res.status(502).json({
          error: "Risk agent returned empty response",
        });
      }

      let parsed: RiskAgentResponse;

      try {
        parsed = JSON.parse(rawContent) as RiskAgentResponse;
      } catch (parseErr) {
        console.warn(
          "Risk Agent: JSON parse failed, returning narrative-only fallback",
          parseErr,
          "\nRaw content:\n",
          rawContent
        );

        // Fallback: treat whole content as narrative, no structured risks
        return res.json({
          analysis_markdown: rawContent,
          risks: [],
        } satisfies RiskAgentResponse);
      }

      const analysis_markdown =
        typeof parsed.analysis_markdown === "string"
          ? parsed.analysis_markdown
          : "";

      const risks = Array.isArray(parsed.risks) ? parsed.risks : [];

      return res.json({
        analysis_markdown,
        risks,
      } satisfies RiskAgentResponse);
    } catch (err: any) {
      console.error("Risk Agent Error:", err?.response?.data || err);

      return res.status(500).json({
        error: "Risk agent failed",
        details: err?.message ?? "Unknown error",
      });
    }
  }
);

export default router;
