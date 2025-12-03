/**
 * Environment Variable Loader
 * 
 * This file MUST be imported FIRST before any other modules that use process.env
 * It loads environment variables from backend/.env file
 */

import dotenv from 'dotenv';

// Load .env from backend directory
// process.cwd() will be the backend/ directory when running npm commands from backend/
dotenv.config();

