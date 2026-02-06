# 🚀 Quick Start: Deploy AI Agent in 5 Minutes

> **Fast deployment guide** for getting an AI agent running in OC-Pipeline

---

## Choose Your Path

### Option 1: Automated Script (Easiest) ⚡

```bash
# Run the automated deployment script
./scripts/deploy-ai-agent.sh

# Follow the prompts:
# 1. Choose framework (LangChain recommended)
# 2. Script creates everything automatically
# 3. Edit .env with your API keys
# 4. Start the agent!
```

**That's it! Agent is ready.**

---

### Option 2: Manual Setup (5 minutes) 🛠️

#### Step 1: Create Agent Directory

```bash
mkdir ai-agent && cd ai-agent
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Step 2: Install LangChain

```bash
pip install langchain langchain-openai fastapi uvicorn supabase python-dotenv
```

#### Step 3: Create .env File

```bash
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-key-here
SUPABASE_URL=https://cwrjhtpycynjzeiggyhf.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=8001
EOF
```

#### Step 4: Create server.py

```python
from fastapi import FastAPI
from langchain_openai import ChatOpenAI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()
app = FastAPI(title="OC-Pipeline AI Agent")

llm = ChatOpenAI(model="gpt-4", temperature=0)

class QueryRequest(BaseModel):
    query: str

@app.post("/api/agent/query")
async def query_agent(request: QueryRequest):
    response = llm.invoke(request.query)
    return {"success": True, "response": response.content}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))
```

#### Step 5: Run Agent

```bash
python server.py
```

#### Step 6: Test

```bash
curl -X POST http://localhost:8001/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Analyze project pipeline status"}'
```

**✅ Done! Your AI agent is running.**

---

## What You Get

- **AI Agent API** running on `http://localhost:8001`
- **Health endpoint** at `/health`
- **Query endpoint** at `/api/agent/query`
- **Ready to integrate** with OC-Pipeline frontend

---

## Next Steps

### 1. Integrate with Frontend

Add to your React app:

```typescript
const queryAI = async (question: string) => {
  const response = await fetch('http://localhost:8001/api/agent/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: question })
  });
  const data = await response.json();
  return data.response;
};
```

### 2. Deploy to Production

```bash
# Option A: Render (Free)
# - Push code to GitHub
# - Connect to Render
# - Deploy in 1 click

# Option B: Docker
docker build -t oc-pipeline-agent .
docker run -p 8001:8001 --env-file .env oc-pipeline-agent
```

### 3. Add Custom Tools

Enhance your agent with construction-specific tools:

```python
from langchain.tools import Tool

def get_project_status(project_id: str) -> str:
    # Query Supabase
    return "Project status data"

tools = [
    Tool(
        name="GetProjectStatus",
        func=get_project_status,
        description="Get status of a construction project"
    )
]
```

---

## Framework Comparison

| Framework | Setup Time | Complexity | Best For |
|-----------|------------|------------|----------|
| **LangChain** | 5 min | Medium | Production |
| **CrewAI** | 5 min | Low | Quick start |
| **SwarmZero** | 3 min | Low | Prototyping |

---

## Common Issues

**Issue:** `ModuleNotFoundError: No module named 'langchain'`  
**Fix:** Make sure virtual environment is activated: `source venv/bin/activate`

**Issue:** `Invalid API key`  
**Fix:** Check your `.env` file has correct `OPENAI_API_KEY`

**Issue:** `Port already in use`  
**Fix:** Change port in `.env`: `PORT=8002`

---

## Resources

- **Full Deployment Guide:** [AI_AGENT_DEPLOYMENT_GUIDE.md](./AI_AGENT_DEPLOYMENT_GUIDE.md)
- **Framework Research:** [AI_AGENT_FRAMEWORKS_RESEARCH.md](./AI_AGENT_FRAMEWORKS_RESEARCH.md)
- **LangChain Docs:** https://python.langchain.com/
- **API Integration:** [API.md](./API.md)

---

## Support

Need help? 
- Check the [full deployment guide](./AI_AGENT_DEPLOYMENT_GUIDE.md)
- Review [troubleshooting section](./AI_AGENT_DEPLOYMENT_GUIDE.md#monitoring--troubleshooting)
- Open an issue on GitHub

---

**🎉 You're ready to build AI-powered construction management!**

Start with the automated script or follow the manual steps above.
