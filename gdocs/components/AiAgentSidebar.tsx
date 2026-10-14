"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Square,
  Undo2,
  MousePointer,
  Zap,
  CheckCircle2,
  Check,
} from "lucide-react";

export interface AiAction {
  type: "replace_selection" | "insert_content" | "append_section" | "rewrite_document";
  summary: string;
  content: string;
  originalText?: string;
}

export interface AiSuggestion {
  id: string;
  msgId: string;
  type: "replace_selection" | "insert_content" | "append_section" | "rewrite_document";
  summary: string;
  originalText?: string;
  content: string;
  status: "pending" | "accepted" | "rejected";
  range?: { from: number; to: number };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AiAction | null;
  suggestion?: AiSuggestion | null;
  timestamp: Date;
  typingCompleted?: boolean;
}

interface AiAgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  editor: any;
  documentTitle: string;
  documentId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  onActiveSuggestionChange?: (suggestion: AiSuggestion | null) => void;
  onSuggestionDecisionRef?: React.MutableRefObject<((decision: "accept" | "reject") => void) | null>;
}

const QUICK_PROMPTS = [
  { label: "✨ Fix grammar & spelling", prompt: "Fix spelling and grammar in the selected text or document." },
  { label: "💼 Make professional", prompt: "Rewrite the selected text in a professional, executive tone." },
  { label: "📝 Summarize document", prompt: "Generate an executive summary and insert it into the document." },
  { label: "➕ Draft next section", prompt: "Draft the next logical section and action items for this document." },
  { label: "⚡ Bullet points", prompt: "Convert key ideas into a structured bulleted list." },
];

export function AiAgentSidebar({
  isOpen,
  onClose,
  editor,
  documentTitle,
  documentId,
  userId,
  userEmail,
  userName,
  onActiveSuggestionChange,
  onSuggestionDecisionRef,
}: AiAgentSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm **Hanoi AI**. Ask me anything or select a prompt below — I'll type the edits and content directly into your document so everyone can see it live!`,
      timestamp: new Date(),
      typingCompleted: true,
    },
  ]);
  const [activeSuggestion, setActiveSuggestion] = useState<AiSuggestion | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingInDoc, setIsTypingInDoc] = useState(false);
  const [typingStatusText, setTypingStatusText] = useState("");
  const [selectedText, setSelectedText] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stopTypingRef = useRef(false);
  const activeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track selection inside TipTap editor
  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      try {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, " ");
          setSelectedText(text.trim());
        } else {
          setSelectedText("");
        }
      } catch {
        setSelectedText("");
      }
    };

    editor.on("selectionUpdate", updateSelection);
    return () => {
      editor.off("selectionUpdate", updateSelection);
    };
  }, [editor]);

  // Scroll ONLY the internal chat container (never scroll the main document window/page)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, isTypingInDoc]);

  // Focus input when opened with preventScroll: true to keep document viewport locked
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    }
  }, [isOpen]);

  // Clean up any running typing interval on unmount
  useEffect(() => {
    return () => {
      if (activeIntervalRef.current) {
        clearInterval(activeIntervalRef.current);
      }
    };
  }, []);

  // Fetch persistent AI chat history for this document from MongoDB
  useEffect(() => {
    if (!documentId) return;

    let isMounted = true;
    async function loadChatHistory() {
      try {
        const res = await fetch(`/api/ai/history/${documentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.history && Array.isArray(data.history) && data.history.length > 0) {
          const loaded: ChatMessage[] = [];
          for (const item of data.history) {
            loaded.push({
              id: `user-${item.id}`,
              role: "user",
              content: item.prompt,
              timestamp: new Date(item.createdAt),
            });
            loaded.push({
              id: item.id,
              role: "assistant",
              content: item.response,
              action: item.action || null,
              timestamp: new Date(item.createdAt),
              typingCompleted: true,
            });
          }
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Hi! I'm **Hanoi AI**. Ask me anything or select a prompt below — I'll type the edits and content directly into your document so everyone can see it live!`,
              timestamp: new Date(),
              typingCompleted: true,
            },
            ...loaded,
          ]);
        }
      } catch (err) {
        console.warn("Could not load AI chat history:", err);
      }
    }

    loadChatHistory();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  // Accept AI suggestion: unsets the highlight and locks content permanently into the document
  const handleAcceptSuggestion = useCallback(
    (sug: AiSuggestion) => {
      if (editor && sug.range) {
        try {
          const docSize = editor.state.doc.content.size;
          const safeFrom = Math.min(Math.max(0, sug.range.from), docSize);
          const safeTo = Math.min(Math.max(safeFrom, sug.range.to), docSize);
          if (safeTo > safeFrom) {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: safeFrom, to: safeTo })
              .unsetHighlight()
              .setTextSelection(safeTo)
              .run();
          }
        } catch (e) {
          console.warn("Could not unset highlight:", e);
        }
      }

      setActiveSuggestion(null);
      if (onActiveSuggestionChange) onActiveSuggestionChange(null);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === sug.msgId
            ? { ...m, suggestion: { ...sug, status: "accepted" } }
            : m
        )
      );
    },
    [editor, onActiveSuggestionChange]
  );

  // Reject AI suggestion: reverts the suggested range back to originalText
  const handleRejectSuggestion = useCallback(
    (sug: AiSuggestion) => {
      if (editor && sug.range) {
        try {
          const docSize = editor.state.doc.content.size;
          const safeFrom = Math.min(Math.max(0, sug.range.from), docSize);
          const safeTo = Math.min(Math.max(safeFrom, sug.range.to), docSize);
          if (safeTo > safeFrom) {
            editor
              .chain()
              .focus()
              .setTextSelection({ from: safeFrom, to: safeTo })
              .deleteSelection()
              .run();

            if (sug.originalText) {
              editor.chain().focus().insertContent(sug.originalText).run();
            }
          }
        } catch (e) {
          console.warn("Could not revert suggestion:", e);
        }
      }

      setActiveSuggestion(null);
      if (onActiveSuggestionChange) onActiveSuggestionChange(null);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === sug.msgId
            ? { ...m, suggestion: { ...sug, status: "rejected" } }
            : m
        )
      );
    },
    [editor, onActiveSuggestionChange]
  );

  // Wire decision ref so top canvas banner can accept/reject
  useEffect(() => {
    if (onSuggestionDecisionRef) {
      onSuggestionDecisionRef.current = (decision: "accept" | "reject") => {
        if (!activeSuggestion) return;
        if (decision === "accept") {
          handleAcceptSuggestion(activeSuggestion);
        } else {
          handleRejectSuggestion(activeSuggestion);
        }
      };
    }
  }, [activeSuggestion, handleAcceptSuggestion, handleRejectSuggestion, onSuggestionDecisionRef]);

  // Gradual typing engine: preserves rich HTML (H1/H2, lists, colors, formatting) and applies suggestion highlight
  const streamTypingIntoDocument = useCallback(
    async (action: AiAction, msgId: string) => {
      if (!editor) return;

      stopTypingRef.current = false;
      setIsTypingInDoc(true);
      setTypingStatusText(action.summary || "Writing into document...");

      const cleanContent = action.content;
      let originalText = action.originalText || "";
      let startPos = editor.state.selection.from;

      try {
        if (action.type === "replace_selection") {
          const { from, to } = editor.state.selection;
          if (from !== to) {
            startPos = from;
            originalText = editor.state.doc.textBetween(from, to, " ");
            editor.chain().focus().deleteRange({ from, to }).run();
          } else if (action.originalText) {
            // Find location of originalText in the document
            const fullDocText = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n");
            const matchIndex = fullDocText.indexOf(action.originalText.trim());
            if (matchIndex !== -1) {
              let cur = 0;
              let targetFrom = from;
              let targetTo = to;
              editor.state.doc.descendants((node: any, pos: number) => {
                if (node.isText) {
                  const text = node.text || "";
                  if (matchIndex >= cur && matchIndex < cur + text.length) {
                    targetFrom = pos + (matchIndex - cur);
                    targetTo = targetFrom + action.originalText!.trim().length;
                    return false;
                  }
                  cur += text.length;
                } else if (node.isBlock) {
                  cur += 1;
                }
              });
              if (targetFrom < targetTo) {
                startPos = targetFrom;
                editor.chain().focus().deleteRange({ from: targetFrom, to: targetTo }).run();
              }
            }
          }
        } else if (action.type === "append_section") {
          const docSize = editor.state.doc.content.size;
          startPos = docSize;
          editor.chain().focus().setTextSelection(docSize).run();
        } else if (action.type === "rewrite_document") {
          startPos = 0;
          originalText = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n");
          editor.chain().focus().clearContent().run();
        }

        // Parse HTML into top-level blocks or elements to preserve rich formatting
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(cleanContent, "text/html");
        const blocks = Array.from(parsedDoc.body.children);

        const insertionStart = editor.state.selection.from;

        if (blocks.length > 1) {
          // Stream block-by-block with rich HTML preserved
          for (const block of blocks) {
            if (stopTypingRef.current) break;
            editor.chain().focus().insertContent(block.outerHTML).run();
            await new Promise((r) => setTimeout(r, 80));
          }
        } else {
          // Single element or inline content: insert full rich HTML cleanly
          editor.chain().focus().insertContent(cleanContent).run();
        }

        const insertionEnd = editor.state.selection.to;

        // Apply a distinct soft suggestion highlight to the newly edited/inserted content
        try {
          if (insertionEnd > insertionStart) {
            editor
              .chain()
              .setTextSelection({ from: insertionStart, to: insertionEnd })
              .setHighlight({ color: "#e0e7ff" })
              .setTextSelection(insertionEnd)
              .run();
          }
        } catch (hErr) {
          console.warn("Could not set suggestion highlight:", hErr);
        }

        const suggestion: AiSuggestion = {
          id: `sug-${Date.now()}`,
          msgId,
          type: action.type,
          summary: action.summary,
          originalText,
          content: cleanContent,
          status: "pending",
          range: { from: insertionStart, to: insertionEnd },
        };

        setActiveSuggestion(suggestion);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, suggestion, typingCompleted: true }
              : m
          )
        );

        if (onActiveSuggestionChange) {
          onActiveSuggestionChange(suggestion);
        }
      } catch (err) {
        console.error("Rich HTML insertion error:", err);
      } finally {
        setIsTypingInDoc(false);
        setTypingStatusText("");
      }
    },
    [editor, onActiveSuggestionChange]
  );

  const handleStopTyping = () => {
    stopTypingRef.current = true;
    if (activeIntervalRef.current) {
      clearInterval(activeIntervalRef.current);
      activeIntervalRef.current = null;
    }
    setIsTypingInDoc(false);
    setTypingStatusText("");
  };

  const handleUndo = () => {
    if (editor) {
      editor.chain().focus().undo().run();
    }
  };

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const messageText = (textToSend || inputValue).trim();
      if (!messageText || isLoading || isTypingInDoc) return;

      const userMessageId = `user-${Date.now()}`;
      const newUserMsg: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newUserMsg]);
      setInputValue("");
      setIsLoading(true);

      let docText = "";
      try {
        if (editor) docText = editor.getText();
      } catch {}

      const currentSelection = selectedText;

      try {
        const history = [...messages, newUserMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(userId ? { "x-dev-user-id": userId } : {}),
            ...(userEmail ? { "x-dev-user-email": userEmail } : {}),
            ...(userName ? { "x-dev-user-name": userName } : {}),
          },
          body: JSON.stringify({
            messages: history,
            documentId,
            userId,
            userEmail,
            userName,
            documentContext: {
              documentId,
              title: documentTitle || "Untitled Document",
              fullText: docText.slice(0, 8000),
              selectedText: currentSelection || undefined,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const assistantMsgId = data.id || `ai-${Date.now()}`;

        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: data.content || "Typing into document now...",
          action: data.action || null,
          timestamp: new Date(),
          typingCompleted: !data.action,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);

        // If the AI returned an edit/generation action, automatically start typing it into the doc live!
        if (data.action && data.action.content) {
          await streamTypingIntoDocument(data.action, assistantMsgId);
        }
      } catch (err: any) {
        console.error("Hanoi AI error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `Sorry, I encountered an issue: ${
              err?.message || "Connection error"
            }. Please try again.`,
            timestamp: new Date(),
            typingCompleted: true,
          },
        ]);
        setIsLoading(false);
      }
    },
    [
      inputValue,
      isLoading,
      isTypingInDoc,
      messages,
      editor,
      documentTitle,
      documentId,
      userId,
      userEmail,
      userName,
      selectedText,
      streamTypingIntoDocument,
    ]
  );

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Chat history cleared. What should we write or edit next in **"${documentTitle}"**?`,
        timestamp: new Date(),
        typingCompleted: true,
      },
    ]);
  };

  // Inline formatting helper
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-semibold text-slate-800 text-xs mt-1.5 mb-0.5">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-3.5 list-disc text-slate-700 text-xs my-0.5">
            {parseInlineMarkup(line.slice(2))}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-700 my-0.5">
          {parseInlineMarkup(line)}
        </p>
      );
    });
  };

  const parseInlineMarkup = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic text-slate-800">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-slate-100 px-1 py-0.2 font-mono text-[10px] text-indigo-600 border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed top-[106px] right-0 z-30 w-80 md:w-96 h-[calc(100vh-106px)] bg-white/95 backdrop-blur-md border-l border-slate-200/80 shadow-2xl flex flex-col select-none print:hidden transition-all duration-200 ease-out"
      aria-label="Hanoi AI Assistant"
    >
      {/* 1. MINIMAL CONTROL BAR (Header name removed per user request) */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-1.5">
          {isTypingInDoc ? (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-semibold animate-pulse shadow-2xs">
              <Sparkles className="h-3 w-3" />
              <span>Typing live in doc...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-700">Hanoi AI</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleResetChat}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Clear chat"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. ACTIVE SELECTION NOTIFICATION (when text is highlighted) */}
      {selectedText && (
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-3 py-1.5 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center space-x-1.5 truncate">
            <MousePointer className="h-3 w-3 text-indigo-600 shrink-0" />
            <span className="font-medium text-[11px] shrink-0">Selected text:</span>
            <span className="truncate italic text-[11px] max-w-[180px]">
              &ldquo;{selectedText}&rdquo;
            </span>
          </div>
          <span className="text-[10px] bg-indigo-200/70 text-indigo-900 rounded-full px-1.5 py-0.2 font-mono shrink-0">
            {selectedText.length}c
          </span>
        </div>
      )}

      {/* 3. LIVE TYPING STATUS BANNER (with STOP and UNDO controls) */}
      {isTypingInDoc && (
        <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-200 px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 truncate">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span className="text-slate-800 font-medium text-[11px] truncate">
              {typingStatusText || "Typing in document..."}
            </span>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handleStopTyping}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold transition shadow-2xs"
              title="Stop AI typing"
            >
              <Square className="h-2.5 w-2.5 fill-white" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. CHAT MESSAGES STREAM */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 select-text"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {msg.role === "user" ? (
              <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 max-w-[88%] text-xs shadow-xs leading-relaxed font-normal">
                {msg.content}
              </div>
            ) : (
              <div className="flex items-start space-x-2 max-w-[95%]">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xs">
                  <Sparkles className="h-2.5 w-2.5" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs text-xs text-slate-800">
                    {renderFormattedText(msg.content)}
                  </div>

                  {/* Suggestion review card with Accept / Reject */}
                  {msg.action && (
                    <div className="rounded-xl border border-indigo-100 bg-white p-2.5 shadow-2xs space-y-2 mt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-1 text-indigo-700 font-medium">
                          <Sparkles className="h-3 w-3 text-indigo-500" />
                          <span>{msg.action.summary || "Suggested Edit"}</span>
                        </div>
                        {msg.suggestion?.status === "accepted" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] flex items-center space-x-1">
                            <Check className="h-2.5 w-2.5" />
                            <span>Accepted</span>
                          </span>
                        ) : msg.suggestion?.status === "rejected" ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px] flex items-center space-x-1">
                            <X className="h-2.5 w-2.5" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium text-[10px]">
                            Reviewing
                          </span>
                        )}
                      </div>

                      {msg.action.originalText && (
                        <div className="text-[10px] bg-rose-50/70 border border-rose-100 rounded p-1.5 text-rose-800 line-through truncate max-h-12 overflow-hidden">
                          {msg.action.originalText}
                        </div>
                      )}

                      {/* Accept & Reject Buttons if pending */}
                      {msg.suggestion?.status === "pending" && (
                        <div className="flex items-center space-x-1.5 pt-1">
                          <button
                            onClick={() => handleAcceptSuggestion(msg.suggestion!)}
                            className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-2xs active:scale-95"
                          >
                            <Check className="h-3 w-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRejectSuggestion(msg.suggestion!)}
                            className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-[11px] font-medium border border-slate-200 transition active:scale-95"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 text-white shadow-2xs animate-pulse">
              <Sparkles className="h-2.5 w-2.5" />
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs px-3 py-2 shadow-2xs flex items-center space-x-2 text-xs text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span>Hanoi AI is preparing your text...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. QUICK PROMPT CHIPS */}
      <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1.5 whitespace-nowrap">
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading || isTypingInDoc}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition shadow-2xs shrink-0 active:scale-95 disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. CHAT INPUT COMPOSER */}
      <div className="p-2.5 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 shadow-2xs focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              selectedText
                ? "Ask Hanoi AI to rewrite/fix highlighted text..."
                : "Ask Hanoi AI to write or edit live in document..."
            }
            className="w-full resize-none bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none leading-relaxed"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isTypingInDoc}
            className="ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs active:scale-95"
            title="Send to Hanoi AI"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>Enter sends, Shift+Enter for newline</span>
          <span className="flex items-center space-x-1 text-indigo-500 font-medium">
            <Zap className="h-2.5 w-2.5 text-amber-500" />
            <span>Direct Live Typing</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
