# AI Agent Deployment Guide for OC-Pipeline

> **Complete guide for deploying AI agents in the construction pipeline management system**
> 
> **Last Updated:** February 6, 2026  
> **Prerequisites:** Review [AI Agent Research Summary](./AI_AGENT_RESEARCH_SUMMARY.md) first

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start - Deploy in 15 Minutes](#quick-start)
3. [Framework-Specific Deployment](#framework-specific-deployment)
   - [LangChain + LangGraph (Recommended)](#1-langchain--langgraph-recommended)
   - [CrewAI (Simple Alternative)](#2-crewai-simple-alternative)
   - [SwarmZero (Quick Prototype)](#3-swarmzero-quick-prototype)
4. [Integration with OC-Pipeline](#integration-with-oc-pipeline)
5. [Docker Deployment](#docker-deployment)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Overview

### Why Deploy AI Agents?

For the OC-Pipeline construction management system, AI agents can:
- **Automate bid analysis** and proposal generation
- **Intelligent project tracking** and status updates
- **Document processing** for contracts and specifications
- **Predictive analytics** for project delays and risks
- **Natural language queries** for pipeline data

### Best Framework for OC-Pipeline

Based on our [comprehensive research](./AI_AGENT_FRAMEWORKS_RESEARCH.md):

| Use Case | Framework | Why |
|----------|-----------|-----|
| **Production** | LangChain + LangGraph | Enterprise-ready, 125K⭐, best ecosystem |
| **Rapid Dev** | CrewAI | Simple API, 43K⭐, role-based agents |
| **POC/Testing** | SwarmZero | Multi-LLM, 264⭐, quick setup |

---

## Quick Start

### Deploy in 15 Minutes (LangChain)

```bash
# 1. Install LangChain
pip install langchain langchain-openai langchain-community

# 2. Set environment variables
export OPENAI_API_KEY="your-key-here"
export SUPABASE_URL="https://cwrjhtpycynjzeiggyhf.supabase.co"
export SUPABASE_KEY="your-anon-key"

# 3. Create simple agent
cat > agent.py << 'EOF'
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# Initialize LLM
llm = ChatOpenAI(model="gpt-4", temperature=0)

# Create prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a construction project management assistant."),
    ("human", "{input}"),
])

# Create agent
agent = create_openai_functions_agent(llm, [], prompt)
executor = AgentExecutor(agent=agent, tools=[])

# Run
result = executor.invoke({"input": "Analyze project pipeline status"})
print(result["output"])
EOF

# 4. Run agent
python agent.py
```

**✅ You now have a working AI agent!**

---

## Framework-Specific Deployment

### 1. LangChain + LangGraph (Recommended)

**Best for:** Production deployments, complex workflows, enterprise features

#### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install LangChain suite
pip install langchain langchain-openai langchain-community langgraph
pip install langchain-anthropic langchain-google-genai  # Optional: multi-LLM

# For vector storage (RAG)
pip install chromadb faiss-cpu
```

#### Configuration

Create `.env`:

```env
# LLM Configuration
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-key  # Optional
GOOGLE_API_KEY=your-google-key      # Optional

# OC-Pipeline Integration
SUPABASE_URL=https://cwrjhtpycynjzeiggyhf.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Vector Store
CHROMA_DB_PATH=./chroma_db

# Agent Settings
AGENT_MODEL=gpt-4
AGENT_TEMPERATURE=0.0
MAX_ITERATIONS=15
```

#### Basic Agent Setup

```python
# agents/pipeline_agent.py
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.tools import Tool
from supabase import create_client
import os

# Initialize Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

# Define tools
def get_project_status(project_id: str) -> str:
    """Get current status of a construction project."""
    response = supabase.table('projects').select('*').eq('id', project_id).execute()
    return str(response.data)

def analyze_pipeline() -> str:
    """Analyze entire project pipeline."""
    response = supabase.table('projects').select('*').execute()
    projects = response.data
    return f"Found {len(projects)} projects in pipeline"

tools = [
    Tool(
        name="GetProjectStatus",
        func=get_project_status,
        description="Get current status of a construction project by ID"
    ),
    Tool(
        name="AnalyzePipeline",
        func=analyze_pipeline,
        description="Analyze entire construction project pipeline"
    )
]

# Create agent
llm = ChatOpenAI(model="gpt-4", temperature=0)
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert construction project management AI assistant.
    You help analyze project pipelines, track bids, and provide insights.
    Be concise and data-driven."""),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_openai_functions_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Export for use
def run_agent(query: str) -> str:
    result = executor.invoke({"input": query})
    return result["output"]
```

#### API Server Setup

```python
# server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from agents.pipeline_agent import run_agent
import uvicorn

app = FastAPI(title="OC-Pipeline AI Agent API")

class QueryRequest(BaseModel):
    query: str
    project_id: str = None

@app.post("/api/agent/query")
async def query_agent(request: QueryRequest):
    try:
        response = run_agent(request.query)
        return {"success": True, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "agent": "langchain"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

#### Deployment

**Option 1: Render (Recommended)**

Create `render.yaml`:

```yaml
services:
  - type: web
    name: oc-pipeline-ai-agent
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: SUPABASE_URL
        value: https://cwrjhtpycynjzeiggyhf.supabase.co
      - key: SUPABASE_ANON_KEY
        sync: false
```

**Option 2: Docker**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

Deploy:
```bash
docker build -t oc-pipeline-agent .
docker run -p 8001:8001 --env-file .env oc-pipeline-agent
```

---

### 2. CrewAI (Simple Alternative)

**Best for:** Quick deployment, role-based agents, simpler workflows

#### Installation

```bash
pip install crewai crewai-tools
```

#### Configuration

```python
# crew_config.py
import os
from crewai import Agent, Task, Crew, Process
from crewai_tools import tool

@tool
def get_pipeline_data():
    """Get construction pipeline data from Supabase"""
    # Implementation here
    return "Pipeline data"

# Define agents
project_analyzer = Agent(
    role='Project Analyst',
    goal='Analyze construction project pipeline and provide insights',
    backstory='Expert in construction project management with 20 years experience',
    verbose=True,
    allow_delegation=False
)

bid_specialist = Agent(
    role='Bid Specialist',
    goal='Analyze bid opportunities and recommend actions',
    backstory='Specialized in government construction contract bidding',
    verbose=True,
    allow_delegation=False
)

# Define tasks
analyze_task = Task(
    description='Analyze current project pipeline and identify bottlenecks',
    agent=project_analyzer,
    tools=[get_pipeline_data]
)

bid_task = Task(
    description='Review pending bids and recommend priorities',
    agent=bid_specialist,
    tools=[get_pipeline_data]
)

# Create crew
crew = Crew(
    agents=[project_analyzer, bid_specialist],
    tasks=[analyze_task, bid_task],
    process=Process.sequential,
    verbose=True
)

# Run crew
def run_crew_analysis():
    result = crew.kickoff()
    return result
```

#### API Server

```python
# crewai_server.py
from fastapi import FastAPI
from crew_config import run_crew_analysis

app = FastAPI()

@app.post("/api/crew/analyze")
async def analyze_pipeline():
    result = run_crew_analysis()
    return {"result": result}

@app.get("/health")
async def health():
    return {"status": "healthy", "framework": "crewai"}
```

#### Deployment

Same as LangChain - use Render or Docker with updated dependencies:

```txt
# requirements.txt
crewai>=0.1.0
crewai-tools>=0.1.0
fastapi>=0.104.0
uvicorn>=0.24.0
supabase>=2.0.0
```

---

### 3. SwarmZero (Quick Prototype)

**Best for:** Multi-LLM testing, rapid prototyping, experimentation

#### Installation

```bash
pip install swarmzero
```

#### Configuration

Create `swarmzero_config.toml`:

```toml
[sdk_context]
config_path = "./swarmzero_config.toml"

[llm]
model = "gpt-4"
temperature = 0.0
max_tokens = 2000

[llm.openai]
api_key = "${OPENAI_API_KEY}"

[llm.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

#### Agent Setup

```python
# swarmzero_agent.py
from swarmzero import Agent
from swarmzero.sdk_context import SDKContext
import os

# Create SDK context
sdk_context = SDKContext(config_path="./swarmzero_config.toml")

# Define tools
def get_projects():
    """Get all projects from pipeline"""
    # Supabase query here
    return "Projects data"

def analyze_bid(project_id: str):
    """Analyze specific bid"""
    return f"Analysis for {project_id}"

# Create agents
pipeline_agent = Agent(
    name="pipeline_analyst",
    functions=[get_projects, analyze_bid],
    instruction="Analyze construction pipeline and provide insights",
    sdk_context=sdk_context
)

# Run agent
pipeline_agent.run()
```

#### API Integration

SwarmZero comes with built-in REST API:

```bash
# Agent automatically starts API server on port 8000
# Test with:
curl --request POST \
  --url http://localhost:8000/api/v1/chat \
  --header 'Content-Type: multipart/form-data' \
  --form 'user_id="admin"' \
  --form 'session_id="session1"' \
  --form 'chat_data={"messages":[{"role":"user","content":"Analyze pipeline"}]}'
```

---

## Integration with OC-Pipeline

### Backend Integration

Add AI agent endpoint to existing Express.js backend:

```javascript
// backend/src/routes/ai-agent.js
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Proxy to AI agent service
router.post('/query', async (req, res) => {
  try {
    const { query, context } = req.body;
    
    // Call AI agent service
    const response = await fetch('http://localhost:8001/api/agent/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

Add to `server.js`:

```javascript
import aiAgentRoutes from './routes/ai-agent.js';
app.use('/api/ai-agent', aiAgentRoutes);
```

### Frontend Integration

Add AI chat component:

```typescript
// frontend/src/components/AIAssistant.tsx
import React, { useState } from 'react';

export function AIAssistant() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('AI query failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="ai-assistant">
      <h3>AI Assistant</h3>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about your pipeline..."
      />
      <button onClick={handleQuery} disabled={loading}>
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>
      {response && <div className="response">{response}</div>}
    </div>
  );
}
```

---

## Docker Deployment

### Complete Docker Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # AI Agent Service
  ai-agent:
    build: ./ai-agent
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    volumes:
      - ./ai-agent:/app
      - agent-data:/app/data
    restart: unless-stopped

  # OC-Pipeline Backend
  backend:
    build: ./backend
    ports:
      - "10000:10000"
    environment:
      - AI_AGENT_URL=http://ai-agent:8001
    depends_on:
      - ai-agent
    restart: unless-stopped

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:10000
      - VITE_AI_AGENT_ENABLED=true
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  agent-data:
```

### Deploy with Docker Compose

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your keys

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f ai-agent

# Stop services
docker-compose down
```

---

## Production Deployment

### Render Deployment (Recommended)

#### Step 1: Prepare Repository

```bash
# Create ai-agent directory
mkdir ai-agent
cd ai-agent

# Create requirements.txt
cat > requirements.txt << EOF
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-community>=0.0.20
fastapi>=0.104.0
uvicorn>=0.24.0
supabase>=2.0.0
python-dotenv>=1.0.0
EOF

# Create server.py (use code from above)

# Create render.yaml
cat > render.yaml << EOF
services:
  - type: web
    name: oc-pipeline-ai-agent
    env: python
    region: oregon
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server:app --host 0.0.0.0 --port \$PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: SUPABASE_URL
        value: https://cwrjhtpycynjzeiggyhf.supabase.co
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: PYTHON_VERSION
        value: 3.11.0
EOF
```

#### Step 2: Deploy to Render

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your repository
5. Select `ai-agent` directory
6. Render will detect `render.yaml` and configure automatically
7. Add environment variables:
   - `OPENAI_API_KEY`
   - `SUPABASE_ANON_KEY`
8. Click "Create Web Service"

#### Step 3: Update Backend

Update backend `ALLOWED_ORIGINS` to include AI agent URL:

```env
ALLOWED_ORIGINS=https://oc-pipeline-ai-agent.onrender.com,https://your-frontend.vercel.app
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Fly.io Deployment

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Deploy
fly deploy
```

---

## Monitoring & Troubleshooting

### Health Checks

```python
# Add to server.py
@app.get("/health/detailed")
async def detailed_health():
    return {
        "status": "healthy",
        "framework": "langchain",
        "llm_provider": os.getenv("AGENT_MODEL", "gpt-4"),
        "supabase_connected": check_supabase(),
        "vector_store": "chroma",
        "uptime": get_uptime()
    }

def check_supabase():
    try:
        supabase.table('projects').select('id').limit(1).execute()
        return True
    except:
        return False
```

### Logging

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Use in agent
@app.post("/api/agent/query")
async def query_agent(request: QueryRequest):
    logger.info(f"Received query: {request.query}")
    try:
        response = run_agent(request.query)
        logger.info(f"Agent response generated successfully")
        return {"success": True, "response": response}
    except Exception as e:
        logger.error(f"Agent error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

### Performance Monitoring

```python
import time
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start_time
        logger.info(f"{func.__name__} took {duration:.2f}s")
        return result
    return wrapper

@app.post("/api/agent/query")
@monitor_performance
async def query_agent(request: QueryRequest):
    # ... existing code
```

### Common Issues

#### Issue: "OpenAI API rate limit exceeded"

**Solution:**
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def call_llm(query):
    return llm.invoke(query)
```

#### Issue: "Supabase connection timeout"

**Solution:**
```python
# Increase timeout
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY"),
    options={
        'timeout': 30  # 30 seconds
    }
)
```

#### Issue: "Agent responses are slow"

**Solutions:**
1. Use streaming responses
2. Cache common queries
3. Reduce max_iterations
4. Use faster models (gpt-3.5-turbo instead of gpt-4)

```python
# Streaming example
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    streaming=True,
    callbacks=[StreamingStdOutCallbackHandler()]
)
```

---

## Cost Management

### Estimate Costs

| Framework | Monthly Cost (1000 queries) |
|-----------|----------------------------|
| LangChain + GPT-4 | ~$50-100 |
| LangChain + GPT-3.5 | ~$5-10 |
| CrewAI + GPT-4 | ~$60-120 |
| SwarmZero + Multiple LLMs | Varies |

### Optimization Tips

1. **Use cheaper models for simple tasks:**
```python
cheap_llm = ChatOpenAI(model="gpt-3.5-turbo")
expensive_llm = ChatOpenAI(model="gpt-4")

# Route based on complexity
llm = expensive_llm if is_complex(query) else cheap_llm
```

2. **Implement caching:**
```python
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache

set_llm_cache(InMemoryCache())
```

3. **Limit token usage:**
```python
llm = ChatOpenAI(
    model="gpt-4",
    max_tokens=500,  # Limit response length
    temperature=0     # More deterministic = more cacheable
)
```

---

## Next Steps

1. **Choose your framework:**
   - Production → LangChain
   - Quick start → CrewAI
   - Testing → SwarmZero

2. **Deploy basic agent** (15 min)
3. **Integrate with OC-Pipeline** (30 min)
4. **Add custom tools** for construction domain (1 hour)
5. **Deploy to production** (30 min)
6. **Monitor and optimize** (ongoing)

---

## Additional Resources

- [LangChain Documentation](https://python.langchain.com/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [SwarmZero Documentation](https://docs.swarmzero.ai/)
- [OC-Pipeline Backend API](./API.md)
- [AI Framework Comparison](./AI_AGENT_FRAMEWORKS_RESEARCH.md)

---

## Support & Community

- **GitHub Issues:** [Report bugs and request features](https://github.com/ALPA-Const/oc-pipeline/issues)
- **LangChain Discord:** https://discord.gg/langchain
- **CrewAI Community:** https://discord.gg/crewai

---

**Ready to deploy? Start with the [Quick Start](#quick-start) section above! 🚀**
