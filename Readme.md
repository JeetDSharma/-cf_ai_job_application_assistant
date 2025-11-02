# AI Job Application Assistant

A comprehensive AI-powered job application assistant built on Cloudflare's infrastructure, featuring conversational AI, workflow automation, and persistent memory.

## 🌟 Features

This application demonstrates all required components for a Cloudflare AI application:

### 1. **LLM Integration** (Llama 3.3 on Workers AI)
- Conversational chat interface powered by Llama 3.3 70B
- Context-aware responses with conversation history
- Specialized for job application assistance

### 2. **Workflow Orchestration** (Cloudflare Workflows)
- Multi-step job application workflow
- Automated generation of:
  - Job description analysis
  - Tailored resume
  - Personalized cover letter
  - Interview preparation tips
- Coordinated AI tasks with step tracking

### 3. **User Input** (Chat Interface)
- Real-time chat interface built with React
- Message history with timestamps
- Session management
- Form-based workflow input

### 4. **Memory & State** (Durable Objects)
- Persistent conversation history
- Session-based memory storage
- Job context tracking
- Message timestamps and metadata

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  • Chat Interface  • Workflow Panel  • TailwindCSS          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Hono Framework)            │
│  • API Routes  • Request Handling  • CORS Support          │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Workers AI  │    │   Workflows  │    │   Durable    │
│              │    │              │    │   Objects    │
│ Llama 3.3    │    │ Multi-step   │    │ Conversation │
│ 70B Model    │    │ Orchestration│    │   Memory     │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 📁 Project Structure

```
├── src/
│   ├── index.ts                      # Main Worker entry point
│   ├── types.ts                      # TypeScript interfaces
│   ├── durable-objects/
│   │   └── ConversationMemory.ts    # Durable Object for state
│   └── workflows/
│       └── JobApplicationWorkflow.ts # Workflow definition
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Main React app
│   │   ├── main.tsx                  # React entry point
│   │   ├── index.css                 # Global styles
│   │   └── components/
│   │       ├── Chat.tsx              # Chat interface
│   │       └── WorkflowPanel.tsx     # Workflow UI
│   ├── package.json
│   └── vite.config.ts
├── wrangler.toml                     # Cloudflare config
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. **Clone and install backend dependencies:**

```bash
npm install
```

2. **Install frontend dependencies:**

```bash
cd frontend
npm install
cd ..
```

3. **Authenticate with Cloudflare:**

```bash
wrangler login
```

4. **Configure KV namespace (optional):**

```bash
# Create KV namespace
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview

# Update wrangler.toml with the returned IDs
```

### Development

1. **Start the Workers backend:**

```bash
npm run dev
```

This starts the Worker at `http://localhost:8787`

2. **In a new terminal, start the frontend:**

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:3000` with API proxy to backend.

3. **Access the application:**

Open `http://localhost:3000` in your browser.

## 🌐 Deployment

### Deploy Backend (Worker)

```bash
# Deploy to Cloudflare
npm run deploy

# Your Worker will be available at:
# https://ai-job-assistant.<your-subdomain>.workers.dev
```

### Deploy Frontend (Pages)

```bash
# Build frontend
cd frontend
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist
```

Or connect your Git repository to Cloudflare Pages for automatic deployments:

1. Go to Cloudflare Dashboard → Pages
2. Create a new project
3. Connect your GitHub/GitLab repository
4. Set build command: `cd frontend && npm install && npm run build`
5. Set build output directory: `frontend/dist`
6. Deploy

### Environment Configuration

After deployment, update the frontend to use your Worker URL:

1. In Cloudflare Pages settings, add environment variable:
   - `VITE_API_URL` = `https://ai-job-assistant.<your-subdomain>.workers.dev/api`

2. Or update `frontend/vite.config.ts` proxy target for production builds.

## 📖 API Endpoints

### Chat Endpoint

**POST** `/api/chat`

```json
{
  "message": "How do I write a cover letter?",
  "sessionId": "session-123",
  "userId": "user-456"
}
```

Response:
```json
{
  "response": "AI response here...",
  "sessionId": "session-123",
  "timestamp": 1234567890
}
```

### Workflow Endpoint

**POST** `/api/workflow`

```json
{
  "jobTitle": "Software Engineer",
  "company": "Cloudflare",
  "jobDescription": "Full job description...",
  "resumeText": "Your resume...",
  "userId": "user-456"
}
```

Response:
```json
{
  "workflowId": "workflow-789",
  "message": "Workflow started successfully",
  "status": "running"
}
```

### Check Workflow Status

**GET** `/api/workflow/:workflowId`

Response:
```json
{
  "workflowId": "workflow-789",
  "status": "complete",
  "output": {
    "analysis": "...",
    "tailoredResume": "...",
    "coverLetter": "...",
    "interviewTips": "..."
  }
}
```

### Conversation History

**GET** `/api/history/:sessionId?limit=50`

**DELETE** `/api/history/:sessionId`

### Update Job Context

**POST** `/api/context/:sessionId`

```json
{
  "jobContext": {
    "jobTitle": "Software Engineer",
    "company": "Cloudflare"
  }
}
```

## 🛠️ Technology Stack

### Backend
- **Cloudflare Workers** - Serverless compute
- **Workers AI** - Llama 3.3 70B Instruct model
- **Cloudflare Workflows** - Multi-step orchestration
- **Durable Objects** - Stateful memory storage
- **Hono** - Lightweight web framework

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Lucide React** - Icons

## 💡 Usage Examples

### Chat Assistant

1. Navigate to the "Chat Assistant" tab
2. Ask questions like:
   - "How do I tailor my resume for a software engineering role?"
   - "What should I include in a cover letter?"
   - "How do I prepare for a technical interview?"
3. The AI maintains conversation context across messages

### Application Workflow

1. Navigate to the "Application Workflow" tab
2. Fill in:
   - Job Title
   - Company Name
   - Job Description (paste full JD)
   - Your Resume (paste your current resume)
3. Click "Start Workflow"
4. Wait for AI to generate:
   - Detailed job analysis
   - Tailored resume
   - Custom cover letter
   - Interview preparation tips

## 🔧 Troubleshooting

### Worker Deployment Issues

- Ensure you're logged into Wrangler: `wrangler whoami`
- Check `wrangler.toml` configuration
- Verify KV namespace IDs are correct

### AI Model Errors

- Workers AI has rate limits - consider implementing caching
- Ensure your Cloudflare account has Workers AI enabled
- Check model name: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

### Durable Objects Not Working

- Ensure migrations are applied (check `wrangler.toml`)
- Durable Objects require a paid Workers plan
- Check DO bindings are correctly configured

### Frontend Build Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Verify all dependencies are installed

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)

## 🎯 Key Cloudflare Components Demonstrated

✅ **LLM Integration** - Llama 3.3 on Workers AI for chat and analysis  
✅ **Workflow Orchestration** - Multi-step job application processing  
✅ **User Input** - Interactive chat and form interfaces  
✅ **Memory/State** - Durable Objects for persistent conversations  
✅ **Serverless** - Deployed on Cloudflare Workers  
✅ **Edge Computing** - Global distribution with low latency  

## 📄 License

MIT License - Feel free to use this project as a template for your own Cloudflare AI applications.

## 🤝 Contributing

This is a demonstration project for Cloudflare AI capabilities. Feel free to fork and customize for your needs!

---

Built with ❤️ on Cloudflare's edge platform
