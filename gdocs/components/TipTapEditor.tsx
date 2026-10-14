"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AnchoredThreads,
  FloatingComposer,
  FloatingThreads,
  FloatingToolbar,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";
import { useThreads, useUpdateMyPresence } from "@liveblocks/react";
import { LiveCursors } from "./LiveCursors";
import { EditorView } from "@tiptap/pm/view";
import { MessageSquare } from "lucide-react";
import { FontSize } from "./FontSizeExtension";
import { PageNumberSettings } from "./PageNumberModal";
import {
  FontFamily,
  TextColor,
  LetterSpacing,
  LineHeight,
} from "./TypographyExtensions";

// Prevents a matchesNode error on hot reloading
if (typeof window !== "undefined" && EditorView.prototype) {
  // @ts-ignore
  EditorView.prototype.updateState = function updateState(state: any) {
    // @ts-ignore
    if (!this.docView) return;
    // @ts-ignore
    this.updateStateInner(state, this.state.plugins != state.plugins);
  };
}

interface EditorProps {
  initialContent?: any;
  rawHtml?: string;
  onContentChange?: (content: any, plainText: string) => void;
  editable?: boolean;
  onEditorReady?: (editor: any) => void;
  showRuler?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  zoom?: number;
  leftMargin?: number;
  rightMargin?: number;
  onMarginsChange?: (left: number, right: number) => void;
  pageNumberSettings?: PageNumberSettings | null;
}

function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function subscribe(callback: () => void) {
  const query = window.matchMedia("(max-width: 1279px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1279px)").matches;
}

function Threads({ editor }: { editor: any }) {
  const { threads } = useThreads();
  const isMobile = useIsMobile();

  if (!threads || !editor) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="print:hidden">
        <FloatingThreads threads={threads} editor={editor} />
      </div>
    );
  }

  return (
    <div className="w-[350px] shrink-0 ml-8 sticky top-16 self-start print:hidden">
      {threads.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs text-left">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span>No comments yet</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Create an inline comment by highlighting any text in the document
            and clicking the <strong className="text-slate-700">Comment</strong>{" "}
            button in the toolbar.
          </p>
        </div>
      ) : (
        <AnchoredThreads
          threads={threads}
          editor={editor}
          style={{ width: 350 }}
        />
      )}
    </div>
  );
}

interface GoogleDocsRulerProps {
  leftMargin: number;
  rightMargin: number;
  onMarginsChange?: (left: number, right: number) => void;
}

function GoogleDocsRuler({
  leftMargin,
  rightMargin,
  onMarginsChange,
}: GoogleDocsRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    if (!dragging || !onMarginsChange) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();

      if (dragging === "left") {
        const offset = Math.round(e.clientX - rect.left);
        const newLeft = Math.max(16, Math.min(220, offset));
        onMarginsChange(newLeft, rightMargin);
      } else if (dragging === "right") {
        const offset = Math.round(rect.right - e.clientX);
        const newRight = Math.max(16, Math.min(220, offset));
        onMarginsChange(leftMargin, newRight);
      }
    };

    const handlePointerUp = () => {
      setDragging(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, leftMargin, rightMargin, onMarginsChange]);

  return (
    <div
      ref={rulerRef}
      className="w-full max-w-[850px] mx-auto h-5 bg-[#e8eaed] border-b border-slate-300 select-none relative mb-4 shadow-2xs overflow-visible print:hidden"
    >
      {/* Active printable area (White background between margins) */}
      <div
        className="absolute top-0 bottom-0 bg-white border-l border-r border-slate-300 pointer-events-none"
        style={{
          left: `${leftMargin}px`,
          right: `${rightMargin}px`,
        }}
      />

      {/* Tick marks & inch markers */}
      <div className="absolute inset-0 flex justify-between items-end text-[9px] text-slate-500 font-mono pb-0.5 px-2 pointer-events-none">
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <div key={num} className="flex flex-col items-center flex-1">
            <div className="flex w-full justify-between items-end h-2 px-1">
              <span className="h-1 w-px bg-slate-300" />
              <span className="h-1.5 w-px bg-slate-400" />
              <span className="h-1 w-px bg-slate-300" />
            </div>
            <span className="leading-none pt-0.5">{num}</span>
          </div>
        ))}
      </div>

      {/* Left Margin Slider Marker */}
      <div
        style={{ left: `${leftMargin}px` }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging("left");
        }}
        className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center cursor-ew-resize group z-20"
        title={`Left margin: ${leftMargin}px (drag to resize)`}
      >
        <div
          className="w-3 h-2 bg-blue-600 shadow-xs hover:bg-blue-700 transition"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
        <div className="w-2.5 h-1.5 bg-blue-600" />
        <div className="w-0.5 h-full bg-blue-600" />

        {dragging === "left" && (
          <div className="absolute top-5 w-px h-[1056px] border-l-2 border-dashed border-blue-500/80 pointer-events-none z-30" />
        )}
      </div>

      {/* Right Margin Slider Marker */}
      <div
        style={{ right: `${rightMargin}px` }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging("right");
        }}
        className="absolute top-0 bottom-0 translate-x-1/2 flex flex-col items-center cursor-ew-resize group z-20"
        title={`Right margin: ${rightMargin}px (drag to resize)`}
      >
        <div
          className="w-3 h-2 bg-blue-600 shadow-xs hover:bg-blue-700 transition"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />
        <div className="w-2.5 h-1.5 bg-blue-600" />
        <div className="w-0.5 h-full bg-blue-600" />

        {dragging === "right" && (
          <div className="absolute top-5 w-px h-[1056px] border-l-2 border-dashed border-blue-500/80 pointer-events-none z-30" />
        )}
      </div>
    </div>
  );
}

function formatPageNumber(
  num: number,
  format?: "numbers" | "roman" | "letters",
): string {
  if (format === "letters") {
    return String.fromCharCode(64 + Math.min(26, Math.max(1, num)));
  }
  if (format === "roman") {
    const romanMap: [number, string][] = [
      [10, "x"],
      [9, "ix"],
      [5, "v"],
      [4, "iv"],
      [1, "i"],
    ];
    let res = "";
    let n = num;
    for (const [val, str] of romanMap) {
      while (n >= val) {
        res += str;
        n -= val;
      }
    }
    return res || "i";
  }
  return num.toString();
}

export function TipTapEditor({
  initialContent,
  rawHtml,
  onContentChange,
  editable = true,
  onEditorReady,
  showRuler = true,
  showHeader = true,
  showFooter = true,
  zoom = 100,
  leftMargin = 64,
  rightMargin = 64,
  onMarginsChange,
  pageNumberSettings = null,
}: EditorProps) {
  const isInternalChange = useRef(false);
  const liveblocks = useLiveblocksExtension();
  const updateMyPresence = useUpdateMyPresence();
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingFooter, setIsEditingFooter] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    updateMyPresence({
      cursor: {
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    editorProps: {
      attributes: {
        class:
          "tiptap outline-none min-h-[850px] focus:outline-none font-sans text-[15px] leading-relaxed text-slate-900",
      },
    },
    extensions: [
      liveblocks,
      StarterKit.configure({
        undoRedo: false, // Liveblocks handles collaborative history
        blockquote: {
          HTMLAttributes: {
            class: "tiptap-blockquote",
          },
        },
        code: {
          HTMLAttributes: {
            class: "tiptap-code",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "tiptap-code-block",
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "tiptap-heading",
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: "tiptap-hr",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "tiptap-list-item",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "tiptap-ordered-list",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "tiptap-paragraph",
          },
        },
      }),
      Underline,
      FontSize,
      FontFamily,
      TextColor,
      LetterSpacing,
      LineHeight,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: "Type @ to insert, or start typing your document…",
        emptyEditorClass: "tiptap-empty",
      }),
    ],
    content: rawHtml || initialContent || "",
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      updateMyPresence({ isTyping: true });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        updateMyPresence({ isTyping: false });
      }, 1000);

      const json = editor.getJSON();
      if (onContentChange) {
        onContentChange(json, editor.getText());
      }
    },
  });

  // Notify parent of editor instance
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  const initialHtmlLoadedRef = useRef(false);
  useEffect(() => {
    if (!editor || initialHtmlLoadedRef.current) return;
    if (rawHtml) {
      editor.commands.setContent(rawHtml);
      initialHtmlLoadedRef.current = true;
    }
  }, [rawHtml, editor]);

  if (!editor) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400 text-sm">
        Connecting to collaborative room...
      </div>
    );
  }

  const pageNumberText = pageNumberSettings
    ? formatPageNumber(pageNumberSettings.startAt, pageNumberSettings.format)
    : "";
  const showHeaderPageNumber =
    pageNumberSettings?.position === "header" &&
    pageNumberSettings.showOnFirstPage;
  const showFooterPageNumber =
    pageNumberSettings?.position === "footer" &&
    pageNumberSettings.showOnFirstPage;

  return (
    <div className="flex flex-col w-full bg-[#f8fafd] min-h-screen relative print:bg-white print:min-h-0 print:p-0">
      {/* Floating Toolbar on Text Selection */}
      <div className="print:hidden">
        <FloatingToolbar editor={editor} />
      </div>

      {/* Main Document & Anchored Comments Layout */}
      <div className="flex-1 py-8 px-4 flex justify-center items-start print:p-0 print:m-0 print:w-full print:block">
        <div
          className="relative flex justify-center items-start w-full max-w-[1280px] print:w-full print:max-w-none print:m-0 print:block"
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: "top center",
          }}
        >
          <div className="w-full max-w-[850px] flex flex-col items-center print:w-full print:max-w-none print:m-0 print:block">
            {/* Google Docs Ruler */}
            {showRuler && (
              <GoogleDocsRuler
                leftMargin={leftMargin}
                rightMargin={rightMargin}
                onMarginsChange={onMarginsChange}
              />
            )}

            {/* Document Sheet Canvas (Google Docs A4 Sheet) */}
            <div
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              className="document-sheet relative w-full min-h-[1056px] bg-white shadow-[0_1px_3px_1px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] border border-slate-200/60 py-12 transition-[padding] print:shadow-none print:border-none print:m-0 print:w-full print:min-h-0"
              style={{
                paddingLeft: `${leftMargin}px`,
                paddingRight: `${rightMargin}px`,
              }}
            >
              {/* Header Area */}
              {showHeader && (
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditingHeader(true);
                  }}
                  className={`mb-6 transition select-none print:m-0 print:border-none ${
                    isEditingHeader
                      ? "border-b border-dashed border-blue-400 pb-3 bg-blue-50/20 rounded-t-lg -mx-2 px-2 print:border-none print:bg-transparent print:p-0"
                      : "min-h-[28px] border-b border-transparent hover:border-slate-200 cursor-pointer group/header print:border-none"
                  }`}
                >
                  {isEditingHeader ? (
                    <div className="space-y-1.5 print:m-0">
                      <div className="flex items-center justify-between print:hidden">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded tracking-wider uppercase">
                          Header
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingHeader(false);
                          }}
                          className="text-[10px] font-medium text-slate-600 bg-slate-200/80 hover:bg-slate-300 px-2 py-0.5 rounded transition"
                        >
                          Close (Esc)
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type header here..."
                          value={headerText}
                          onChange={(e) => setHeaderText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setIsEditingHeader(false);
                          }}
                          className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-sans print:text-black"
                        />
                        {showHeaderPageNumber && (
                          <span
                            className={`text-[11px] font-medium text-slate-500 whitespace-nowrap pl-2 print:text-black ${
                              pageNumberSettings?.alignment === "left"
                                ? "order-first pr-2"
                                : pageNumberSettings?.alignment === "center"
                                  ? "mx-auto"
                                  : "text-right"
                            }`}
                          >
                            Page {pageNumberText}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400 min-h-[22px]">
                      <div className="flex-1 truncate print:text-black">
                        {headerText || (
                          <span className="text-[11px] text-slate-300 opacity-0 group-hover/header:opacity-100 transition italic print:hidden">
                            Double-click to edit header
                          </span>
                        )}
                      </div>
                      {showHeaderPageNumber && (
                        <span
                          className={`text-[11px] font-medium text-slate-400 whitespace-nowrap print:text-black ${
                            pageNumberSettings?.alignment === "left"
                              ? "order-first pr-2"
                              : pageNumberSettings?.alignment === "center"
                                ? "mx-auto"
                                : "text-right"
                          }`}
                        >
                          Page {pageNumberText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Multiplayer Cursors */}
              <div className="print:hidden">
                <LiveCursors />
              </div>

              {/* Document Editor Body */}
              <EditorContent editor={editor} />

              {/* Floating Composer appears beside highlighted text */}
              <div className="print:hidden">
                <FloatingComposer editor={editor} style={{ width: 350 }} />
              </div>

              {/* Footer Area with Page Numbers */}
              {showFooter && (
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setIsEditingFooter(true);
                  }}
                  className={`mt-10 transition select-none print:m-0 print:border-none ${
                    isEditingFooter
                      ? "border-t border-dashed border-blue-400 pt-3 bg-blue-50/20 rounded-b-lg -mx-2 px-2 print:border-none print:bg-transparent print:p-0"
                      : "min-h-[28px] border-t border-transparent hover:border-slate-200 cursor-pointer group/footer print:border-none"
                  }`}
                >
                  {isEditingFooter ? (
                    <div className="space-y-1.5 print:m-0">
                      <div className="flex items-center justify-between text-xs text-slate-700">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type footer here..."
                          value={footerText}
                          onChange={(e) => setFooterText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setIsEditingFooter(false);
                          }}
                          className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-sans print:text-black"
                        />
                        {showFooterPageNumber && (
                          <span
                            className={`text-[11px] font-medium text-slate-500 whitespace-nowrap pl-2 print:text-black ${
                              pageNumberSettings?.alignment === "left"
                                ? "order-first pr-2"
                                : pageNumberSettings?.alignment === "center"
                                  ? "mx-auto"
                                  : "text-right"
                            }`}
                          >
                            Page {pageNumberText}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between print:hidden">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded tracking-wider uppercase">
                          Footer
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingFooter(false);
                          }}
                          className="text-[10px] font-medium text-slate-600 bg-slate-200/80 hover:bg-slate-300 px-2 py-0.5 rounded transition"
                        >
                          Close (Esc)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400 min-h-[22px]">
                      <div className="flex-1 truncate print:text-black">
                        {footerText || (
                          <span className="text-[11px] text-slate-300 opacity-0 group-hover/footer:opacity-100 transition italic print:hidden">
                            Double-click to edit footer
                          </span>
                        )}
                      </div>
                      {showFooterPageNumber && (
                        <span
                          className={`text-[11px] font-medium text-slate-400 whitespace-nowrap print:text-black ${
                            pageNumberSettings?.alignment === "left"
                              ? "order-first pr-2"
                              : pageNumberSettings?.alignment === "center"
                                ? "mx-auto"
                                : "text-right"
                          }`}
                        >
                          Page {pageNumberText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Threads: Anchored on desktop beside document sheet, floating on mobile */}
          <Threads editor={editor} />
        </div>
      </div>
    </div>
  );
}
