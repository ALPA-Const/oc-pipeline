#!/bin/bash

# AI Agent Quick Deploy Script for OC-Pipeline
# This script automates the deployment of AI agents

set -e  # Exit on error

echo "🤖 OC-Pipeline AI Agent Deployment Script"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi
print_success "Python 3 found: $(python3 --version)"

# Check pip
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed"
    exit 1
fi
print_success "pip3 found"

echo ""
echo "Select AI Framework to Deploy:"
echo "1) LangChain + LangGraph (Recommended for production)"
echo "2) CrewAI (Simple, role-based agents)"
echo "3) SwarmZero (Quick prototyping)"
echo ""
read -p "Enter choice [1-3]: " framework_choice

case $framework_choice in
    1)
        FRAMEWORK="langchain"
        print_info "Selected: LangChain + LangGraph"
        ;;
    2)
        FRAMEWORK="crewai"
        print_info "Selected: CrewAI"
        ;;
    3)
        FRAMEWORK="swarmzero"
        print_info "Selected: SwarmZero"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_info "Creating ai-agent directory..."
mkdir -p ai-agent
cd ai-agent

# Create virtual environment
print_info "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies based on framework
print_info "Installing dependencies for $FRAMEWORK..."

case $FRAMEWORK in
    "langchain")
        cat > requirements.txt << EOF
langchain>=0.1.0
langchain-openai>=0.0.5
langchain-community>=0.0.20
langgraph>=0.0.20
fastapi>=0.104.0
uvicorn>=0.24.0
supabase>=2.0.0
python-dotenv>=1.0.0
chromadb>=0.4.0
EOF
        ;;
    "crewai")
        cat > requirements.txt << EOF
crewai>=0.1.0
crewai-tools>=0.1.0
fastapi>=0.104.0
uvicorn>=0.24.0
supabase>=2.0.0
python-dotenv>=1.0.0
EOF
        ;;
    "swarmzero")
        cat > requirements.txt << EOF
swarmzero>=0.1.0
python-dotenv>=1.0.0
EOF
        ;;
esac

pip install -r requirements.txt
print_success "Dependencies installed"

# Create .env file
print_info "Creating .env file..."
cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=your-openai-key-here

# Anthropic (Optional)
ANTHROPIC_API_KEY=your-anthropic-key-here

# Google (Optional)
GOOGLE_API_KEY=your-google-key-here

# OC-Pipeline Integration
SUPABASE_URL=https://cwrjhtpycynjzeiggyhf.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Agent Configuration
AGENT_MODEL=gpt-4
AGENT_TEMPERATURE=0.0
MAX_ITERATIONS=15

# Server
PORT=8001
EOF

print_warning "Please edit .env file with your API keys!"
print_info ".env file created at: $(pwd)/.env"

# Create basic server based on framework
print_info "Creating server.py..."

if [ "$FRAMEWORK" = "langchain" ]; then
    cat > server.py << 'EOF'
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.tools import Tool
from supabase import create_client
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="OC-Pipeline AI Agent (LangChain)")

# Initialize Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

# Define tools
def analyze_pipeline() -> str:
    """Analyze construction project pipeline"""
    try:
        response = supabase.table('projects').select('*').execute()
        count = len(response.data) if response.data else 0
        return f"Found {count} projects in pipeline"
    except Exception as e:
        return f"Error accessing pipeline: {str(e)}"

tools = [
    Tool(
        name="AnalyzePipeline",
        func=analyze_pipeline,
        description="Analyze entire construction project pipeline"
    )
]

# Create agent
llm = ChatOpenAI(model=os.getenv("AGENT_MODEL", "gpt-4"), temperature=0)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert construction project management AI assistant."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_openai_functions_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

class QueryRequest(BaseModel):
    query: str

@app.post("/api/agent/query")
async def query_agent(request: QueryRequest):
    try:
        result = executor.invoke({"input": request.query})
        return {"success": True, "response": result["output"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "framework": "langchain"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
EOF

elif [ "$FRAMEWORK" = "crewai" ]; then
    cat > server.py << 'EOF'
from fastapi import FastAPI, HTTPException
from crewai import Agent, Task, Crew, Process
from supabase import create_client
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="OC-Pipeline AI Agent (CrewAI)")

# Initialize Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

# Create agent
project_analyst = Agent(
    role='Construction Project Analyst',
    goal='Analyze construction project pipeline',
    backstory='Expert in construction project management',
    verbose=True
)

@app.post("/api/agent/query")
async def query_agent(query: dict):
    try:
        task = Task(
            description=query.get("query", "Analyze pipeline"),
            agent=project_analyst
        )
        crew = Crew(agents=[project_analyst], tasks=[task], process=Process.sequential)
        result = crew.kickoff()
        return {"success": True, "response": str(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "framework": "crewai"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
EOF

else  # swarmzero
    cat > agent.py << 'EOF'
from swarmzero import Agent
from swarmzero.sdk_context import SDKContext
from dotenv import load_dotenv

load_dotenv()

# Create config
config = {
    "llm": {
        "model": "gpt-4",
        "temperature": 0.0
    }
}

# Create agent
pipeline_agent = Agent(
    name="pipeline_analyst",
    functions=[],
    instruction="You are a construction project management assistant. Analyze pipelines and provide insights.",
)

if __name__ == "__main__":
    print("SwarmZero agent starting on port 8000...")
    pipeline_agent.run()
EOF
fi

print_success "Server files created"

# Create Dockerfile
print_info "Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["python", "server.py"]
EOF

print_success "Dockerfile created"

# Create render.yaml
print_info "Creating render.yaml for deployment..."
cat > render.yaml << EOF
services:
  - type: web
    name: oc-pipeline-ai-agent-$FRAMEWORK
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python server.py
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: SUPABASE_URL
        value: https://cwrjhtpycynjzeiggyhf.supabase.co
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: PORT
        value: 8001
EOF

print_success "render.yaml created"

# Create README
cat > README.md << EOF
# OC-Pipeline AI Agent ($FRAMEWORK)

## Quick Start

1. Edit .env file with your API keys
2. Run locally:
   \`\`\`bash
   source venv/bin/activate
   python server.py
   \`\`\`
3. Test: \`curl http://localhost:8001/health\`

## Deploy to Render

1. Push to GitHub
2. Go to render.com
3. Import this directory
4. Add environment variables
5. Deploy!

## API Endpoints

- POST /api/agent/query - Query the AI agent
- GET /health - Health check

## Documentation

See main project documentation for more details.
EOF

echo ""
print_success "Setup complete! 🎉"
echo ""
echo "📋 Next Steps:"
echo "   1. Edit .env file with your API keys: $(pwd)/.env"
echo "   2. Start the agent:"
echo "      cd ai-agent"
echo "      source venv/bin/activate"
echo "      python server.py"
echo "   3. Test at http://localhost:8001"
echo ""
echo "📚 Full documentation: docs/AI_AGENT_DEPLOYMENT_GUIDE.md"
echo ""

# Offer to open editor
read -p "Open .env file in editor now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    elif command -v vi &> /dev/null; then
        vi .env
    else
        print_info "Please edit .env manually"
    fi
fi

print_success "Deployment script complete! Ready to start your AI agent."
