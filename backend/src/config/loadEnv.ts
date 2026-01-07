// backend/src/config/loadEnv.ts
import path from "path";
import dotenv from "dotenv";

// Resolve the path to backend/.env
const envPath = path.resolve(__dirname, "../../.env");

// Load environment variables from that file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env file from", envPath, result.error);
} else {
  console.log("✅ Loaded environment variables from", envPath);
}

// Ensure module side-effect
export {};
