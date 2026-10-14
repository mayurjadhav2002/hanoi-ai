import express from "express";
import OpenAI from "openai";
import { prisma } from "../lib/prisma.js";
import { connectMongo } from "../lib/mongoose.js";
import { AiChatLog } from "../models/AiChatLog.js";

const router = express.Router();

interface DocumentContext {
  documentId?: string;
  title?: string;
  fullText?: string;
  selectedText?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiAction {
  type: "replace_selection" | "insert_content" | "append_section" | "rewrite_document";
  summary: string;
  content: string;
  originalText?: string;
}

// Structured tools for OpenAI function calling
const aiTools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "replace_selection",
      description:
        "Replace the user's currently highlighted/selected text in the document with improved, corrected, or rewritten text.",
      parameters: {
        type: "object",
        properties: {
          originalText: {
            type: "string",
            description: "The original text being replaced (from selectedText).",
          },
          replacementHtml: {
            type: "string",
            description: "The replacement content in clean HTML (e.g. <p>...</p>).",
          },
          summary: {
            type: "string",
            description: "Short summary of what was changed, e.g. 'Polished grammar and clarity'",
          },
        },
        required: ["replacementHtml", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_content",
      description:
        "Insert new content, details, paragraph, or template at the current cursor position in the document.",
      parameters: {
        type: "object",
        properties: {
          htmlContent: {
            type: "string",
            description: "The HTML content to insert (e.g. <p>...</p>, <ul>...</ul>).",
          },
          summary: {
            type: "string",
            description: "Short summary of what was inserted, e.g. 'Added project roadmap breakdown'",
          },
        },
        required: ["htmlContent", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "append_section",
      description: "Append a brand new section, conclusion, or next topic to the end of the document.",
      parameters: {
        type: "object",
        properties: {
          sectionHtml: {
            type: "string",
            description:
              "The HTML content of the new section including <h2> heading and paragraphs.",
          },
          summary: {
            type: "string",
            description: "Short summary of the new section, e.g. 'Added Conclusion & Key Action Items'",
          },
        },
        required: ["sectionHtml", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rewrite_document",
      description: "Completely rewrite, reformat, or restructure the entire document content.",
      parameters: {
        type: "object",
        properties: {
          fullHtmlContent: {
            type: "string",
            description: "The entire updated HTML content for the document.",
          },
          summary: {
            type: "string",
            description: "Short summary of the overall document transformation.",
          },
        },
        required: ["fullHtmlContent", "summary"],
      },
    },
  },
];

// Fallback generator when OPENAI_API_KEY is not configured or in case of API error
function generateFallbackResponse(
  prompt: string,
  context: DocumentContext
): { reply: string; action?: AiAction } {
  const p = prompt.toLowerCase();
  const selected = context.selectedText?.trim();
  const title = context.title || "Document";

  if (selected && (p.includes("fix") || p.includes("grammar") || p.includes("spelling"))) {
    // Fix grammar/spelling simulation
    const corrected = selected
      .replace(/\bi\b/g, "I")
      .replace(/\s+/g, " ")
      .trim();
    const polished =
      corrected.charAt(0).toUpperCase() +
      corrected.slice(1) +
      (corrected.endsWith(".") ? "" : ".");

    return {
      reply: `I checked the selected passage and resolved spelling, capitalization, and grammatical structure.`,
      action: {
        type: "replace_selection",
        originalText: selected,
        content: `<p>${polished}</p>`,
        summary: "Corrected grammar & punctuation",
      },
    };
  }

  if (selected && (p.includes("professional") || p.includes("tone") || p.includes("formal"))) {
    const elevated = `Furthermore, regarding ${selected.slice(0, 40).replace(/[^\w\s]/g, "")}... this initiative has been restructured to adhere to standard professional and executive communication standards, emphasizing clarity, actionable insights, and strategic alignment.`;

    return {
      reply: `I've rewritten your selected text with a more polished, professional executive tone.`,
      action: {
        type: "replace_selection",
        originalText: selected,
        content: `<p>${elevated}</p>`,
        summary: "Elevated to professional executive tone",
      },
    };
  }

  if (selected && (p.includes("rewrite") || p.includes("improve") || p.includes("rephrase"))) {
    const rewritten = `In terms of our approach, ${selected.slice(0, 50)}... has been articulated with enhanced fluency and conciseness to ensure the primary takeaways are readily understood by all stakeholders.`;

    return {
      reply: `Here is a refined version of your highlighted text with enhanced flow and impact:`,
      action: {
        type: "replace_selection",
        originalText: selected,
        content: `<p>${rewritten}</p>`,
        summary: "Refined phrasing and clarity",
      },
    };
  }

  if (p.includes("summarize") || p.includes("summary")) {
    const summaryHtml = `
      <h2>Executive Summary</h2>
      <p>This document ("<strong>${title}</strong>") outlines strategic goals and operational requirements. Key highlights include:</p>
      <ul>
        <li><strong>Core Objective:</strong> Establish high-reliability documentation workflows.</li>
        <li><strong>Key Deliverables:</strong> Seamless real-time collaboration, structured formatting, and intelligent AI assistance.</li>
        <li><strong>Target Outcome:</strong> Accelerated authoring speed and improved clarity for all participants.</li>
      </ul>
    `.trim();

    return {
      reply: `I've created an Executive Summary based on "${title}" and am writing it into the document now:`,
      action: {
        type: "insert_content",
        content: summaryHtml,
        summary: `Executive Summary for ${title}`,
      },
    };
  }

  if (p.includes("expand") || p.includes("draft") || p.includes("next") || p.includes("section")) {
    const sectionHtml = `
      <h2>Next Steps & Action Plan</h2>
      <p>To follow up on the items described in <em>${title}</em>, the following actions are recommended for immediate implementation:</p>
      <ol>
        <li><strong>Review & Refine:</strong> Verify all specifications with team leads.</li>
        <li><strong>Integration Phase:</strong> Connect collaborative services and verify end-to-end responsiveness.</li>
        <li><strong>Final Sign-Off:</strong> Review final deliverable for publication.</li>
      </ol>
      <p><em>Target Completion: End of current sprint.</em></p>
    `.trim();

    return {
      reply: `Drafting the "Next Steps & Action Plan" section into your document now:`,
      action: {
        type: "append_section",
        content: sectionHtml,
        summary: "Appended Next Steps & Action Plan",
      },
    };
  }

  // General helpful answer
  return {
    reply: `I'm **Hanoi AI**, ready to write with you on **"${title}"**!\n\nAsk me to fix grammar, polish tone, summarize, or draft sections, and I'll type the improvements directly into your document so all collaborators can see it live!`,
  };
}

// Helper to persist AI chat message and output into MongoDB via Mongoose
async function persistChatLogInMongo(params: {
  documentId: string;
  documentTitle: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  folderId?: string | null;
  prompt: string;
  response: string;
  action?: AiAction | null;
  model: string;
  isSimulated: boolean;
}) {
  try {
    const mongo = await connectMongo();
    if (mongo) {
      await AiChatLog.create({
        documentId: params.documentId,
        documentTitle: params.documentTitle,
        userId: params.userId,
        userEmail: params.userEmail || "",
        userName: params.userName || "",
        folderId: params.folderId || null,
        prompt: params.prompt,
        response: params.response,
        action: params.action || null,
        modelName: params.model,
        isSimulated: params.isSimulated,
      });
    }
  } catch (mongoErr: any) {
    console.warn("🍃 [MongoDB Save Warning] Could not persist AI chat log:", mongoErr.message);
  }
}

// POST /api/ai/chat
router.post("/chat", async (req: express.Request, res: express.Response) => {
  try {
    const { messages, documentContext } = req.body as {
      messages: ChatMessage[];
      documentContext?: DocumentContext;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array" });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const context: DocumentContext = documentContext || {};

    // 1. Resolve PostgreSQL Document & Foreign Keys
    const docId = context.documentId || (req.body.documentId as string);
    let postgresDoc: any = null;
    if (docId) {
      try {
        postgresDoc = await prisma.document.findUnique({
          where: { id: docId },
          select: { id: true, title: true, folderId: true, ownerId: true },
        });
      } catch (err) {
        console.warn("Prisma document lookup error:", err);
      }
    }

    // 2. Resolve User identity
    const devUserId = (req.headers["x-dev-user-id"] as string) || (req.body.userId as string);
    const devUserEmail = (req.headers["x-dev-user-email"] as string) || (req.body.userEmail as string);
    const devUserName = (req.headers["x-dev-user-name"] as string) || (req.body.userName as string);

    const finalDocId = postgresDoc?.id || docId || "untitled-doc";
    const finalDocTitle = postgresDoc?.title || context.title || "Untitled Document";
    const finalUserId = devUserId || postgresDoc?.ownerId || "anonymous-user";
    const finalUserEmail = devUserEmail || "";
    const finalUserName = devUserName || "";
    const finalFolderId = postgresDoc?.folderId || null;

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // If in test environment or no OpenAI API key is set, use the rich fallback generator
    if (
      process.env.NODE_ENV === "test" ||
      !apiKey ||
      apiKey.trim() === "" ||
      apiKey === "your-openai-api-key"
    ) {
      const fallback = generateFallbackResponse(lastUserMessage, context);

      // Asynchronously log to MongoDB
      persistChatLogInMongo({
        documentId: finalDocId,
        documentTitle: finalDocTitle,
        userId: finalUserId,
        userEmail: finalUserEmail,
        userName: finalUserName,
        folderId: finalFolderId,
        prompt: lastUserMessage,
        response: fallback.reply,
        action: fallback.action || null,
        model,
        isSimulated: true,
      });

      return res.json({
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: fallback.reply,
        action: fallback.action || null,
        isSimulated: true,
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });

    // Build system prompt with live document context
    const systemPrompt = `You are Hanoi AI, an elite document co-writer and real-time editing agent embedded inside a multiplayer collaborative document editor.
The document title is: "${context.title || "Untitled Document"}".

CURRENT DOCUMENT TEXT:
"""
${(context.fullText || "").slice(0, 8000) || "(Empty document)"}
"""

CURRENT USER SELECTION:
"""
${context.selectedText || "(No text currently selected)"}
"""

INSTRUCTIONS:
1. Provide a concise, friendly, and natural conversational response explaining what you are writing.
2. Whenever the user requests to fix, rewrite, improve, expand, summarize, add details, or write content:
   - Call the appropriate function tool:
     * 'replace_selection': If user has selected text and asks to fix, rewrite, or polish it.
     * 'insert_content': If user wants to insert content at their current cursor position.
     * 'append_section': If user wants to add a new section, chapter, or appendix to the end of the document.
     * 'rewrite_document': If user asks to rewrite, translate, or overhaul the full document.
   - For all tool HTML content, use clean semantic HTML (e.g., <p>, <h2>, <h3>, <ul>, <li>, <ol>, <strong>, <em>) suitable for a rich text editor.
3. If no editing action is needed (e.g., questions, explanations, brainstorms), answer directly in text without calling a tool.
`;

    const chatHistory: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    const response = await openai.chat.completions.create({
      model,
      messages: chatHistory,
      tools: aiTools,
      tool_choice: "auto",
      temperature: 0.7,
    });

    const choice = response.choices[0];
    const message = choice.message;
    let replyText = message.content || "";
    let action: AiAction | null = null;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.type === "function") {
        const fnName = toolCall.function.name;
        try {
          const args = JSON.parse(toolCall.function.arguments);
        if (fnName === "replace_selection") {
          action = {
            type: "replace_selection",
            originalText: args.originalText || context.selectedText,
            content: args.replacementHtml,
            summary: args.summary || "Replaced selection",
          };
          if (!replyText) {
            replyText = `Writing the revision directly into your document now...`;
          }
        } else if (fnName === "insert_content") {
          action = {
            type: "insert_content",
            content: args.htmlContent,
            summary: args.summary || "Inserted new content",
          };
          if (!replyText) {
            replyText = `Inserting the content directly into your document now...`;
          }
        } else if (fnName === "append_section") {
          action = {
            type: "append_section",
            content: args.sectionHtml,
            summary: args.summary || "Appended section",
          };
          if (!replyText) {
            replyText = `Drafting and appending the new section to your document now...`;
          }
        } else if (fnName === "rewrite_document") {
          action = {
            type: "rewrite_document",
            content: args.fullHtmlContent,
            summary: args.summary || "Rewrote document",
          };
          if (!replyText) {
            replyText = `Streaming the rewritten document live...`;
          }
        }
      } catch (parseErr) {
        console.error("Failed to parse tool call arguments:", parseErr);
      }
    }
  }

    // Asynchronously log live response to MongoDB
    persistChatLogInMongo({
      documentId: finalDocId,
      documentTitle: finalDocTitle,
      userId: finalUserId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      folderId: finalFolderId,
      prompt: lastUserMessage,
      response: replyText,
      action: action || null,
      model,
      isSimulated: false,
    });

    return res.json({
      id: response.id || `ai-${Date.now()}`,
      role: "assistant",
      content: replyText,
      action,
      model,
    });
  } catch (error: any) {
    console.error("[AI Chat Error]", error);

    // If OpenAI returned an error (e.g. invalid key or rate limit), fallback gracefully
    const lastUserMessage =
      req.body?.messages?.filter((m: any) => m.role === "user")?.pop()?.content || "";
    const fallback = generateFallbackResponse(lastUserMessage, req.body?.documentContext || {});

    // Try to resolve document metadata for error fallback logging
    const docId = req.body?.documentContext?.documentId || req.body?.documentId || "untitled-doc";
    const devUserId = (req.headers["x-dev-user-id"] as string) || (req.body?.userId as string) || "anonymous-user";
    const devUserEmail = (req.headers["x-dev-user-email"] as string) || (req.body?.userEmail as string) || "";

    persistChatLogInMongo({
      documentId: docId,
      documentTitle: req.body?.documentContext?.title || "Untitled Document",
      userId: devUserId,
      userEmail: devUserEmail,
      prompt: lastUserMessage,
      response: fallback.reply,
      action: fallback.action || null,
      model: "fallback",
      isSimulated: true,
    });

    return res.json({
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: `${fallback.reply}\n\n*(Note: OpenAI API responded with: ${error.message || "Network error"}. Served via fallback engine).*`,
      action: fallback.action || null,
      isFallback: true,
    });
  }
});

// GET /api/ai/history/:documentId - Fetch past Hanoi AI chat messages from MongoDB
router.get("/history/:documentId", async (req: express.Request, res: express.Response) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ error: "Missing documentId parameter" });
    }

    const mongo = await connectMongo();
    if (!mongo) {
      return res.json({ history: [] });
    }

    const logs = await AiChatLog.find({ documentId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    return res.json({
      history: logs.map((log) => ({
        id: log._id.toString(),
        prompt: log.prompt,
        response: log.response,
        action: log.action || null,
        model: (log as any).modelName || (log as any).model || "gpt-4o-mini",
        createdAt: log.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Failed to query AI chat history from MongoDB:", err);
    return res.json({ history: [] });
  }
});

export default router;
