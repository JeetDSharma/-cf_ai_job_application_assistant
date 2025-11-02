import { Hono } from "hono";
import { cors } from "hono/cors";
import { ConversationMemory } from "./durable-objects/ConversationMemory";
import { JobApplicationWorkflow } from "./workflows/JobApplicationWorkflow";
import type { Env, ChatRequest, WorkflowRequest } from "./types";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend
app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
}));

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "AI Job Application Assistant API",
    version: "1.0.0",
    endpoints: {
      chat: "POST /api/chat",
      workflow: "POST /api/workflow",
      history: "GET /api/history/:sessionId",
      context: "POST /api/context/:sessionId",
    },
  });
});

// Chat endpoint - uses Workers AI (Llama 3.3) with conversation memory
app.post("/api/chat", async (c) => {
  try {
    const { message, sessionId, userId }: ChatRequest = await c.req.json();

    if (!message || !sessionId || !userId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Get or create Durable Object for this session
    const conversationId = c.env.CONVERSATIONS.idFromName(sessionId);
    const conversationStub = c.env.CONVERSATIONS.get(conversationId);

    // Initialize conversation if needed
    await conversationStub.fetch(`http://do/init`, {
      method: "POST",
      body: JSON.stringify({ userId, sessionId }),
    });

    // Add user message to history
    await conversationStub.fetch(`http://do/message`, {
      method: "POST",
      body: JSON.stringify({ role: "user", content: message }),
    });

    // Get conversation history for context
    const historyResponse = await conversationStub.fetch(`http://do/history?limit=10`);
    const { messages } = await historyResponse.json() as { messages: any[] };

    // Call Workers AI with conversation context
    const aiResponse = await c.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 2048,
      temperature: 0.7,
    });

    const assistantMessage = aiResponse.response as string;

    // Save assistant response to history
    await conversationStub.fetch(`http://do/message`, {
      method: "POST",
      body: JSON.stringify({ role: "assistant", content: assistantMessage }),
    });

    return c.json({
      response: assistantMessage,
      sessionId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Failed to process chat message" }, 500);
  }
});

// Get conversation history
app.get("/api/history/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const limit = c.req.query("limit") || "50";

    const conversationId = c.env.CONVERSATIONS.idFromName(sessionId);
    const conversationStub = c.env.CONVERSATIONS.get(conversationId);

    const response = await conversationStub.fetch(`http://do/history?limit=${limit}`);
    const data = await response.json();

    return c.json(data);
  } catch (error) {
    console.error("History error:", error);
    return c.json({ error: "Failed to retrieve history" }, 500);
  }
});

// Update job context for conversation
app.post("/api/context/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const jobContext = await c.req.json();

    const conversationId = c.env.CONVERSATIONS.idFromName(sessionId);
    const conversationStub = c.env.CONVERSATIONS.get(conversationId);

    const response = await conversationStub.fetch(`http://do/context`, {
      method: "POST",
      body: JSON.stringify({ jobContext }),
    });

    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Context error:", error);
    return c.json({ error: "Failed to update context" }, 500);
  }
});

// Workflow endpoint - triggers multi-step job application workflow
app.post("/api/workflow", async (c) => {
  try {
    const workflowData: WorkflowRequest = await c.req.json();

    if (!workflowData.jobDescription || !workflowData.resumeText || !workflowData.jobTitle) {
      return c.json({ error: "Missing required workflow fields" }, 400);
    }

    // Trigger workflow
    const instance = await c.env.JOB_WORKFLOW.create({
      params: workflowData,
    });

    return c.json({
      workflowId: instance.id,
      message: "Workflow started successfully",
      status: "running",
    });
  } catch (error) {
    console.error("Workflow error:", error);
    return c.json({ error: "Failed to start workflow" }, 500);
  }
});

// Check workflow status
app.get("/api/workflow/:workflowId", async (c) => {
  try {
    const workflowId = c.req.param("workflowId");
    
    const instance = await c.env.JOB_WORKFLOW.get(workflowId);
    
    return c.json({
      workflowId,
      status: instance.status,
      output: await instance.output,
    });
  } catch (error) {
    console.error("Workflow status error:", error);
    return c.json({ error: "Failed to get workflow status" }, 500);
  }
});

// Clear conversation history
app.delete("/api/history/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");

    const conversationId = c.env.CONVERSATIONS.idFromName(sessionId);
    const conversationStub = c.env.CONVERSATIONS.get(conversationId);

    await conversationStub.fetch(`http://do/clear`, { method: "POST" });

    return c.json({ success: true, message: "History cleared" });
  } catch (error) {
    console.error("Clear history error:", error);
    return c.json({ error: "Failed to clear history" }, 500);
  }
});

// Export Durable Objects and Workflow
export { ConversationMemory, JobApplicationWorkflow };

// Export default Worker
export default app;
