import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import configuration
import { testConnection } from "./config/database";

// Import routes
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projects";
import memberRoutes from "./routes/members";

// Import ISDC module routes
import submittalRoutes from "./routes/submittals";
import specificationRoutes from "./routes/specifications";
import closeoutRoutes from "./routes/closeout";

// Import error handler
import { errorHandler } from "./middleware/errorHandler";

// TEMPORARY: Import mock auth for testing
import { mockAuthenticate } from "./middleware/auth";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "https://ocpipeline.vercel.app",
  "http://localhost:5173",
  "http://localhost:5175",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}
// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================
// TEMPORARY MOCK AUTHENTICATION
// ============================================
// TODO: REMOVE THIS BEFORE PRODUCTION!
// Added: 2025-12-03 for dashboard testing
// This bypasses all authentication - NOT SECURE
console.log("⚠️ WARNING: Mock authentication is ENABLED");
console.log("⚠️ This should ONLY be used for testing");
app.use(mockAuthenticate);
// ============================================

// ============================================
// ROUTES
// ============================================

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/members", memberRoutes);

// ISDC Module routes
app.use("/api/submittals", submittalRoutes);
app.use("/api/specifications", specificationRoutes);
app.use("/api/closeout", closeoutRoutes);

// Root route
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "OC Pipeline Backend API",
    version: "1.0.0",
    modules: {
      core: ["auth", "admin", "workspaces", "users", "projects"],
      isdc: ["submittals", "specifications", "closeout"],
      atlas: ["agents", "knowledge-graph", "event-bus"],
    },
    documentation: "/api/docs",
    health: "/health",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 10000;

async function start() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error("❌ Failed to connect to database");
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`🚀 OC Pipeline Backend started`);
      console.log(`🔐 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Server running on port ${PORT}`);
      console.log(`✅ ISDC Module: Loaded`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

export default app;
