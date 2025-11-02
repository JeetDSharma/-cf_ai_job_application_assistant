export interface Env {
  AI: Ai;
  CONVERSATIONS: DurableObjectNamespace;
  JOB_WORKFLOW: Workflow;
  KV: KVNamespace;
  ENVIRONMENT: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  userId: string;
}

export interface WorkflowRequest {
  jobDescription: string;
  resumeText: string;
  jobTitle: string;
  company: string;
  userId: string;
}
