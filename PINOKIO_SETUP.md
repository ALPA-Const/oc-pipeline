# Pinokio Setup Guide for Browser Use AI

To run the **Browser-Use** agent locally via **Pinokio**, follow these steps:

## 1. Install Pinokio

Download and install Pinokio from the official website: [https://pinokio.computer](https://pinokio.computer)

## 2. Install the Browser-Use App

1. Open Pinokio.
2. Click on the **"Discover"** tab.
3. Search for **"Browser Use"**.
4. Click **"Download"** on the repository (usually `browser-use` or a related community template).

## 3. Configuration

1. Once downloaded, click on the **"Browser Use"** app in your Pinokio library.
2. Look for a **"Config"** or **"Environment"** button.
3. Paste your API Keys:
    - `GOOGLE_API_KEY`: For the free Gemini 2.0 Flash model.
    - `ANTHROPIC_API_KEY`: For the Claude 3.5 Sonnet model.

## 4. Running

1. Click **"Start"**.
2. Pinokio will automatically install Python, Playwright, and all dependencies in a virtual environment.
3. You can then enter a prompt like: *"Find the cheapest flight from NYC to London next week"* and watch the browser work!

---
*Note: Using Gemini 2.0 Flash via Google AI Studio is currently the most cost-effective (free) way to use this agent.*
