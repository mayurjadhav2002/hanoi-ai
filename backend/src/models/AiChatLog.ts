import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiAction {
  type: "replace_selection" | "insert_content" | "append_section" | "rewrite_document";
  summary: string;
  content: string;
  originalText?: string;
}

export interface IAiChatLog {
  // Foreign Keys linking to PostgreSQL Schema
  documentId: string;       // Foreign key -> PostgreSQL Document.id
  documentTitle?: string;   // Snapshot of document title
  userId: string;           // Foreign key -> PostgreSQL User.id
  userEmail?: string;       // PostgreSQL User.email
  userName?: string;        // PostgreSQL User.name
  folderId?: string | null; // Foreign key -> PostgreSQL Folder.id (nullable)

  // AI Message & Generated Output
  prompt: string;           // User prompt / command
  response: string;         // Hanoi AI natural language response
  action?: IAiAction | null;// Structured action output streamed into document

  // Operational Metadata
  modelName: string;        // e.g. "gpt-4o-mini"
  isSimulated: boolean;     // whether fallback simulation was used
  createdAt?: Date;
  updatedAt?: Date;
}

const AiActionSchema = new Schema<IAiAction>(
  {
    type: {
      type: String,
      enum: ["replace_selection", "insert_content", "append_section", "rewrite_document"],
      required: true,
    },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    originalText: { type: String, default: null },
  },
  { _id: false }
);

const AiChatLogSchema = new Schema<IAiChatLog>(
  {
    // PostgreSQL Foreign Keys
    documentId: {
      type: String,
      required: true,
      index: true,
    },
    documentTitle: {
      type: String,
      default: "Untitled Document",
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
      default: "",
    },
    userName: {
      type: String,
      default: "",
    },
    folderId: {
      type: String,
      default: null,
      index: true,
    },

    // Chat Message Content & Tool Output
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    action: {
      type: AiActionSchema,
      default: null,
    },

    // Operational metadata
    modelName: {
      type: String,
      default: "gpt-4o-mini",
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "ai_chat_logs",
  }
);

// Compound index for querying chat history for a specific document chronologically
AiChatLogSchema.index({ documentId: 1, createdAt: 1 });

// Index for querying interactions by user
AiChatLogSchema.index({ userId: 1, createdAt: -1 });

export const AiChatLog: Model<IAiChatLog> =
  mongoose.models.AiChatLog || mongoose.model<IAiChatLog>("AiChatLog", AiChatLogSchema);
