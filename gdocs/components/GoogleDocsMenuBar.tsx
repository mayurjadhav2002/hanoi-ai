"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Printer,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Download,
  FileCode,
  Columns,
  Hash,
  Eye,
  PanelLeft,
  HelpCircle,
  FilePlus,
  Copy,
  Scissors,
  Check,
  Maximize2,
  Sparkles,
} from "lucide-react";

interface GoogleDocsMenuBarProps {
  editor: any;
  title: string;
  onExport: (format: "pdf" | "docx" | "md") => void;
  onPrint: () => void;
  onNewDocument: () => void;
  onOpenDashboard: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  showRuler: boolean;
  onToggleRuler: () => void;
  showHeader: boolean;
  onToggleHeader: () => void;
  showFooter: boolean;
  onToggleFooter: () => void;
  onOpenWordCount: () => void;
  onOpenComments: () => void;
  onOpenPageNumbers?: () => void;
  onToggleAi?: () => void;
  isAiOpen?: boolean;
}

export function GoogleDocsMenuBar({
  editor,
  title,
  onExport,
  onPrint,
  onNewDocument,
  onOpenDashboard,
  onToggleSidebar,
  isSidebarOpen,
  showRuler,
  onToggleRuler,
  showHeader,
  onToggleHeader,
  showFooter,
  onToggleFooter,
  onOpenWordCount,
  onOpenComments,
  onOpenPageNumbers,
  onToggleAi,
  isAiOpen,
}: GoogleDocsMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuHover = (menu: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const closeMenu = () => setActiveMenu(null);

  return (
    <div ref={menuBarRef} className="flex items-center space-x-0.5 text-xs select-none">
      {/* FILE MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("file")}
          onMouseEnter={() => handleMenuHover("file")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "file" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          File
        </button>

        {activeMenu === "file" && (
          <div className="absolute left-0 top-full mt-1 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <button
              onClick={() => {
                closeMenu();
                onNewDocument();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <FilePlus className="h-4 w-4 text-slate-500" />
                <span>New document</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+N</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onOpenDashboard();
              }}
              className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <FileText className="h-4 w-4 text-slate-500" />
              <span>Open...</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            {/* Export Section */}
            <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Download as
            </div>

            <button
              onClick={() => {
                closeMenu();
                onExport("pdf");
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-red-500" />
                <span>PDF Document (.pdf)</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onExport("docx");
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Microsoft Word (.docx)</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeMenu();
                onExport("md");
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileCode className="h-4 w-4 text-emerald-500" />
                <span>Markdown (.md)</span>
              </div>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                onPrint();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Print</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+P</span>
            </button>
          </div>
        )}
      </div>

      {/* EDIT MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("edit")}
          onMouseEnter={() => handleMenuHover("edit")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "edit" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          Edit
        </button>

        {activeMenu === "edit" && (
          <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().undo().run();
              }}
              disabled={!editor?.can().undo()}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 disabled:opacity-40 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Undo className="h-4 w-4 text-slate-500" />
                <span>Undo</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Z</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().redo().run();
              }}
              disabled={!editor?.can().redo()}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 disabled:opacity-40 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Redo className="h-4 w-4 text-slate-500" />
                <span>Redo</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Y</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                document.execCommand("cut");
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Scissors className="h-4 w-4 text-slate-500" />
                <span>Cut</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+X</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                document.execCommand("copy");
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Copy</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+C</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().selectAll().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <span>Select all</span>
              <span className="text-[10px] text-slate-400">Ctrl+A</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("view")}
          onMouseEnter={() => handleMenuHover("view")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "view" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          View
        </button>

        {activeMenu === "view" && (
          <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <button
              onClick={() => {
                closeMenu();
                onToggleSidebar();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <PanelLeft className="h-4 w-4 text-slate-500" />
                <span>Show document tabs</span>
              </div>
              {isSidebarOpen && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </button>

            <button
              onClick={() => {
                closeMenu();
                onToggleRuler();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Columns className="h-4 w-4 text-slate-500" />
                <span>Show ruler</span>
              </div>
              {showRuler && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <Maximize2 className="h-4 w-4 text-slate-500" />
              <span>Full screen</span>
            </button>
          </div>
        )}
      </div>

      {/* INSERT MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("insert")}
          onMouseEnter={() => handleMenuHover("insert")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "insert" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          Insert
        </button>

        {activeMenu === "insert" && (
          <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              }}
              className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <TableIcon className="h-4 w-4 text-slate-500" />
              <span>Table (3x3 grid)</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().setHorizontalRule().run();
              }}
              className="flex w-full items-center space-x-2 rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="h-0.5 w-4 bg-slate-400" />
              <span>Horizontal line</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                onToggleHeader();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <span>Header</span>
              {showHeader && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </button>

            <button
              onClick={() => {
                closeMenu();
                onToggleFooter();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <span>Footer</span>
              {showFooter && <Check className="h-3.5 w-3.5 text-blue-600" />}
            </button>

            <button
              onClick={() => {
                closeMenu();
                if (onOpenPageNumbers) onOpenPageNumbers();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-slate-500" />
                <span>Page numbers...</span>
              </div>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                onOpenComments();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <span>Comment</span>
              <span className="text-[10px] text-slate-400">Ctrl+Alt+M</span>
            </button>
          </div>
        )}
      </div>

      {/* FORMAT MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("format")}
          onMouseEnter={() => handleMenuHover("format")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "format" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          Format
        </button>

        {activeMenu === "format" && (
          <div className="absolute left-0 top-full mt-1 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Text
            </div>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().toggleBold().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Bold className="h-4 w-4" />
                <span className="font-bold">Bold</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+B</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().toggleItalic().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Italic className="h-4 w-4" />
                <span className="italic">Italic</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+I</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().toggleUnderline().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <UnderlineIcon className="h-4 w-4" />
                <span className="underline">Underline</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+U</span>
            </button>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().toggleStrike().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Strikethrough className="h-4 w-4" />
                <span className="line-through">Strikethrough</span>
              </div>
            </button>

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().toggleCode().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span className="font-mono">Inline code</span>
              </div>
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                closeMenu();
                editor?.chain().focus().unsetAllMarks().clearNodes().run();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs text-red-600"
            >
              <span>Clear formatting</span>
              <span className="text-[10px] text-slate-400">Ctrl+\</span>
            </button>
          </div>
        )}
      </div>

      {/* TOOLS MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("tools")}
          onMouseEnter={() => handleMenuHover("tools")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "tools" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          Tools
        </button>

        {activeMenu === "tools" && (
          <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <button
              onClick={() => {
                closeMenu();
                onOpenWordCount();
              }}
              className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-slate-100 text-left text-xs"
            >
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-slate-500" />
                <span>Word count</span>
              </div>
              <span className="text-[10px] text-slate-400">Ctrl+Shift+C</span>
            </button>

            {onToggleAi && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    closeMenu();
                    onToggleAi();
                  }}
                  className="flex w-full items-center justify-between rounded px-2.5 py-1.5 hover:bg-indigo-50 text-left text-xs text-indigo-700 font-medium"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                    <span>Hanoi AI Assistant</span>
                  </div>
                  <span className="text-[10px] text-indigo-400">Ctrl+J</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* HELP */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick("help")}
          onMouseEnter={() => handleMenuHover("help")}
          className={`px-2 py-1 rounded text-slate-700 hover:bg-slate-100 transition font-medium ${
            activeMenu === "help" ? "bg-slate-200 text-slate-900" : ""
          }`}
        >
          Help
        </button>

        {activeMenu === "help" && (
          <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-xl z-50 text-slate-700">
            <div className="p-2.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-900">Hanoi AI Collaborative Editor</div>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                A real-time multiplayer document editor with Liveblocks CRDT sync, inline comments, document tabs, multi-format exports, and Hanoi AI co-writer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
