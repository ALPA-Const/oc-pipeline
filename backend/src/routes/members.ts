import { Router } from "express";

const router = Router();

// Placeholder route
router.get("/health", (_req, res) => {
  res.json({ status: "members routes healthy" });
});

export default router;
