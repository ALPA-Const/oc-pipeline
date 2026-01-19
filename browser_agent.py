import os
import asyncio
from dotenv import load_dotenv
from browser_use import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic

# Load environment variables
load_dotenv()

async def main():
    # --------------------------------------------------------------------------
    # CONFIGURATION: Choose your model
    # --------------------------------------------------------------------------
    
    # 1. GOOGLE GEMINI (FULLY FREE via AI Studio)
    # Get key at: https://aistudio.google.com/
    gemini_key = os.getenv('GOOGLE_API_KEY')
    if gemini_key:
        llm = ChatGoogleGenerativeAI(
            model='gemini-2.0-flash', 
            google_api_key=gemini_key
        )
        print("Using Gemini 2.0 Flash (Free Tier)")
    
    # 2. CLAUDE (PREMIUM via Anthropic)
    # Get key at: https://console.anthropic.com/
    elif os.getenv('ANTHROPIC_API_KEY'):
        llm = ChatAnthropic(
            model='claude-3-5-sonnet-20241022', 
            api_key=os.getenv('ANTHROPIC_API_KEY')
        )
        print("Using Claude 3.5 Sonnet")
    
    else:
        print("❌ Error: No API Key found in .env file.")
        print("Please add GOOGLE_API_KEY or ANTHROPIC_API_KEY to your .env file.")
        return

    # --------------------------------------------------------------------------
    # TASK DEFINITION
    # --------------------------------------------------------------------------
    task = "Go to Google, search for 'Antigravity AI', and tell me the first result."
    
    agent = Agent(
        task=task,
        llm=llm,
    )

    result = await agent.run()
    print("\n\n--- AGENT RESULT ---")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
