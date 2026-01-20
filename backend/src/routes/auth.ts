import { Router } from "express";

const router: any = Router();

// Placeholder route
router.get("/health", (req, res) => {
  res.json({ status: "auth routes healthy" });
});

export default router;
