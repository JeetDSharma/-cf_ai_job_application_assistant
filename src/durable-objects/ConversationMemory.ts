import { DurableObject } from "cloudflare:workers";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ConversationState {
  messages: Message[];
  metadata: {
    userId: string;
    sessionId: string;
    createdAt: number;
    lastActivityAt: number;
    jobContext?: {
      jobTitle?: string;
      company?: string;
      jobDescription?: string;
      resumeText?: string;
    };
  };
}

export class ConversationMemory extends DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case "/init":
          return await this.handleInit(request);
        case "/message":
          return await this.handleAddMessage(request);
        case "/history":
          return await this.handleGetHistory(request);
        case "/context":
          return await this.handleUpdateContext(request);
        case "/clear":
          return await this.handleClear(request);
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Error in ConversationMemory:", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private async handleInit(request: Request): Promise<Response> {
    const body = await request.json();
    const { userId, sessionId } = body as { userId: string; sessionId: string };

    const existingState = await this.state.storage.get<ConversationState>("conversation");

    if (!existingState) {
      const initialState: ConversationState = {
        messages: [
          {
            role: "system",
            content: "You are a helpful AI job application assistant. Help users with resume tailoring, cover letter writing, interview preparation, and job search advice.",
            timestamp: Date.now(),
          },
        ],
        metadata: {
          userId,
          sessionId,
          createdAt: Date.now(),
          lastActivityAt: Date.now(),
        },
      };

      await this.state.storage.put("conversation", initialState);
      return new Response(JSON.stringify({ success: true, state: initialState }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, state: existingState }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleAddMessage(request: Request): Promise<Response> {
    const body = await request.json();
    const { role, content } = body as { role: "user" | "assistant"; content: string };

    const conversation = await this.state.storage.get<ConversationState>("conversation");

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not initialized" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newMessage: Message = {
      role,
      content,
      timestamp: Date.now(),
    };

    conversation.messages.push(newMessage);
    conversation.metadata.lastActivityAt = Date.now();

    await this.state.storage.put("conversation", conversation);

    return new Response(JSON.stringify({ success: true, message: newMessage }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleGetHistory(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const conversation = await this.state.storage.get<ConversationState>("conversation");

    if (!conversation) {
      return new Response(JSON.stringify({ messages: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = conversation.messages.slice(-limit);

    return new Response(JSON.stringify({ 
      messages, 
      metadata: conversation.metadata 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleUpdateContext(request: Request): Promise<Response> {
    const body = await request.json();
    const { jobContext } = body as { jobContext: ConversationState["metadata"]["jobContext"] };

    const conversation = await this.state.storage.get<ConversationState>("conversation");

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Conversation not initialized" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    conversation.metadata.jobContext = {
      ...conversation.metadata.jobContext,
      ...jobContext,
    };

    await this.state.storage.put("conversation", conversation);

    return new Response(JSON.stringify({ success: true, context: conversation.metadata.jobContext }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  private async handleClear(request: Request): Promise<Response> {
    await this.state.storage.deleteAll();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
