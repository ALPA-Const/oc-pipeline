import { Router } from "express";

const router = Router();

// Placeholder route
router.get("/health", (req, res) => {
  res.json({ status: "projects routes healthy" });
});

export default router;
