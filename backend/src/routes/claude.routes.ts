// =====================================================
// Claude AI Routes
// API endpoints for Claude chat integration
// =====================================================

import { Router, Request, Response } from "express";
import { claudeService } from "../services/ai/claude.service";

const router = Router();

/**
 * POST /api/claude/chat
 * Send a message to Claude and get a response
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    const response = await claudeService.chat({
      message,
      conversationHistory,
      context,
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("Claude chat error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process chat request",
    });
  }
});

/**
 * POST /api/claude/chat/stream
 * Stream a response from Claude using Server-Sent Events
 */
router.post("/chat/stream", async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    await claudeService.streamChat(
      { message, conversationHistory, context },
      (chunk: string) => {
        res.write(
          `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`
        );
      },
      (usage: { inputTokens: number; outputTokens: number }) => {
        res.write(`data: ${JSON.stringify({ type: "complete", usage })}\n\n`);
        res.end();
      }
    );
  } catch (error: any) {
    console.error("Claude stream error:", error);
    res.write(
      `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
    );
    res.end();
  }
});

/**
 * POST /api/claude/analyze-document
 * Analyze a document and extract key information
 */
router.post("/analyze-document", async (req: Request, res: Response) => {
  try {
    const { content, docType } = req.body;

    if (!content || !docType) {
      return res.status(400).json({
        success: false,
        error: "Content and docType are required",
      });
    }

    const analysis = await claudeService.analyzeDocument(content, docType);

    return res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error("Document analysis error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze document",
    });
  }
});

/**
 * POST /api/claude/assess-risk
 * Generate a risk assessment for project data
 */
router.post("/assess-risk", async (req: Request, res: Response) => {
  try {
    const { projectData } = req.body;

    if (!projectData) {
      return res.status(400).json({
        success: false,
        error: "Project data is required",
      });
    }

    const assessment = await claudeService.assessRisk(projectData);

    return res.json({
      success: true,
      data: assessment,
    });
  } catch (error: any) {
    console.error("Risk assessment error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to assess risk",
    });
  }
});

/**
 * GET /api/claude/health
 * Check if Claude API is configured and accessible
 */
router.get("/health", async (_req: Request, res: Response) => {
  const apiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;

  if (!apiKeyConfigured) {
    return res.status(503).json({
      success: false,
      status: "unconfigured",
      message: "ANTHROPIC_API_KEY is not set",
    });
  }

  try {
    // Quick test message
    const response = await claudeService.chat({
      message: "Reply with only: OK",
    });

    return res.json({
      success: true,
      status: "healthy",
      model: "claude-sonnet-4-20250514",
      testResponse: response.message,
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      status: "error",
      message: error.message,
    });
  }
});

export default router;
