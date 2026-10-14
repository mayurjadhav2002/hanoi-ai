"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Share2,
  Paperclip,
  Check,
  Cloud,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Download,
  FileCode,
  MessageSquare,
  Star,
  Lock,
  PanelLeft,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react";
import { apiFetch } from "@/lib/api";
import { TipTapEditor } from "@/components/TipTapEditor";
import { ShareModal } from "@/components/ShareModal";
import { AttachmentsDrawer } from "@/components/AttachmentsDrawer";
import { ActiveAvatars } from "@/components/ActiveAvatars";
import { CommentsOverlay } from "@/components/CommentsOverlay";
import { LiveblocksWrapper } from "@/components/LiveblocksWrapper";
import { GoogleDocsMenuBar } from "@/components/GoogleDocsMenuBar";
import { GoogleDocsToolbar } from "@/components/GoogleDocsToolbar";
import {
  DocumentOutlineSidebar,
  DocumentTab,
} from "@/components/DocumentOutlineSidebar";
import { WordCountModal } from "@/components/WordCountModal";
import {
  PageNumberModal,
  PageNumberSettings,
} from "@/components/PageNumberModal";
import { AiAgentSidebar, AiSuggestion } from "@/components/AiAgentSidebar";

interface DocumentWorkspaceProps {
  initialDocument: any;
  role: string;
  documentId: string;
}

function DocumentWorkspace({
  initialDocument,
  role,
  documentId,
}: DocumentWorkspaceProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [document, setDocument] = useState<any>(initialDocument);
  const [title, setTitle] = useState(
    initialDocument?.title || "Untitled Document",
  );
  const [isStarred, setIsStarred] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialDocument?.updatedAt ? new Date(initialDocument.updatedAt) : null,
  );

  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isWordCountOpen, setIsWordCountOpen] = useState(false);
  const [isPageNumberModalOpen, setIsPageNumberModalOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [activeAiSuggestion, setActiveAiSuggestion] =
    useState<AiSuggestion | null>(null);
  const suggestionDecisionRef = useRef<
    ((decision: "accept" | "reject") => void) | null
  >(null);

  // Keyboard shortcut Ctrl+J / Cmd+J to toggle AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsAiSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Margins & Page Numbering Settings
  const [leftMargin, setLeftMargin] = useState(64);
  const [rightMargin, setRightMargin] = useState(64);
  const [pageNumberSettings, setPageNumberSettings] =
    useState<PageNumberSettings | null>(null);

  // View state & Google Docs sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [zoom, setZoom] = useState(100);

  // Document Tabs & Headings Outline
  const [tabs, setTabs] = useState<DocumentTab[]>([
    { id: "tab-1", name: "Main Document" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");

  const latestContentRef = useRef<any>(initialDocument?.content || null);

  // Liveblocks real-time title synchronization across peers
  const broadcast = useBroadcastEvent();

  useEventListener(({ event }: any) => {
    if (event?.type === "TITLE_CHANGED" && typeof event.title === "string") {
      setTitle(event.title);
    }
  });

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    broadcast({ type: "TITLE_CHANGED", title: newTitle });
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save handler for document content
  const handleContentChange = useCallback(
    (content: any, plainText: string) => {
      latestContentRef.current = content;
      if (role === "VIEWER") return;

      setIsSaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const token = await getToken();
          await apiFetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            token,
            devUser: user
              ? {
                  id: user.id,
                  email: user?.primaryEmailAddress?.emailAddress || "",
                  name: user.fullName || "",
                }
              : undefined,
            body: JSON.stringify({ content, plainText }),
          });
          setLastSaved(new Date());
        } catch (err) {
          console.error("Failed to auto-save document:", err);
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    },
    [documentId, role, user, getToken],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Title persistence on blur
  const handleTitleBlur = async () => {
    if (role === "VIEWER" || title === document?.title) return;
    try {
      const token = await getToken();
      await apiFetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
        body: JSON.stringify({ title }),
      });
      setLastSaved(new Date());
      setDocument((prev: any) => ({ ...prev, title }));
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  // Document export handler
  const handleExport = async (format: "pdf" | "docx" | "md") => {
    try {
      const token = await getToken();
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const userName = user?.fullName;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        if (userEmail) headers["x-user-email"] = userEmail;
        if (userName) headers["x-user-name"] = userName;
      } else if (user) {
        headers["x-dev-user-id"] = user.id;
        if (userEmail) headers["x-dev-user-email"] = userEmail;
        if (userName) headers["x-dev-user-name"] = userName;
      }

      const res = await fetch("/api/files/export", {
        method: "POST",
        headers,
        body: JSON.stringify({
          documentId,
          format,
          title: title || document?.title || "Document",
          content: latestContentRef.current || document?.content,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || `Export failed with status ${res.status}`,
        );
      }

      const blob = await res.blob();
      const safeTitle = (title || "Document").replace(/[/\\?%*:|"<>]/g, "_");
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = window.document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = `${safeTitle}.${format}`;
      window.document.body.appendChild(downloadLink);
      downloadLink.click();
      window.URL.revokeObjectURL(blobUrl);
      downloadLink.remove();
    } catch (err: any) {
      console.error("Export error:", err);
      alert(err?.message || "Failed to export document.");
    }
  };

  // Add new tab handler
  const handleAddTab = () => {
    const newName = `Tab ${tabs.length + 1}`;
    const newId = `tab-${Date.now()}`;
    const newTab: DocumentTab = {
      id: newId,
      name: newName,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    if (editorInstance) {
      editorInstance
        .chain()
        .focus()
        .insertContent(`<h2>${newName}</h2><p></p>`)
        .run();
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      handleHeadingClick(tabId, tab.name);
    }
  };

  const handleRenameTab = (tabId: string, newName: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, name: newName } : t)),
    );
  };

  const handleDeleteTab = (tabId: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handlePrint = () => {
    const cleanTitle = (title || document?.title || "Document").trim();
    const prevTitle = window.document.title;
    window.document.title = cleanTitle;
    window.print();
    setTimeout(() => {
      window.document.title = prevTitle;
    }, 1000);
  };

  // Smooth scroll to heading in document
  const handleHeadingClick = (_id: string, text: string) => {
    const elements = window.document.querySelectorAll("h1, h2, h3");
    for (let el of Array.from(elements)) {
      if (el.textContent?.trim() === text.trim()) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafd] print:bg-white print:min-h-0 print:p-0">
      {/* 1. GOOGLE DOCS TOP APPLICATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs select-none print:hidden">
        <div className="flex items-center justify-between px-3 py-1.5">
          {/* Left: Hanoi AI Logo + Title + Menu Bar */}
          <div className="flex items-start space-x-2.5">
            {/* Hanoi AI Brand & Logo */}
            <button
              onClick={() => router.push("/")}
              className="mt-0.5 flex items-center space-x-2 rounded-lg py-1 px-1.5 hover:bg-slate-100 transition shrink-0 group"
              title="Hanoi AI home"
            >
              <Image
                src="/logo_transparent_bg.png"
                alt="Hanoi AI"
                width={30}
                height={30}
                className="h-7 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
                priority
              />
              <div className="hidden sm:flex items-baseline space-x-1 select-none pr-1">
                <span className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
                  Hanoi
                </span>
                <span className="text-base font-medium text-slate-500 tracking-tight font-sans">
                  AI
                </span>
              </div>
            </button>

            {/* Title & Menus Stack */}
            <div className="flex flex-col">
              {/* Title row */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={title}
                  disabled={role === "VIEWER"}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="rounded px-1.5 py-0.5 text-base font-semibold text-slate-800 hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-sm sm:max-w-md transition"
                />
                {/* Star Button */}
                <button
                  onClick={() => setIsStarred((prev) => !prev)}
                  className={`p-1 rounded hover:bg-slate-100 transition ${
                    isStarred
                      ? "text-amber-500"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                  title={isStarred ? "Starred" : "Star document"}
                >
                  <Star
                    className={`h-4 w-4 ${isStarred ? "fill-amber-400 text-amber-500" : ""}`}
                  />
                </button>

                {/* Cloud Save Status Indicator */}
                <div className="flex items-center space-x-1 text-[11px] text-slate-400 pl-1">
                  {isSaving ? (
                    <>
                      <Cloud className="h-3 w-3 animate-pulse text-blue-500" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="h-3 w-3 text-slate-400" />
                      <span className="hidden sm:inline">
                        {lastSaved ? "Saved to Drive" : "All changes saved"}
                      </span>
                    </>
                  )}
                </div>

                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {role}
                </span>
              </div>

              {/* Menu Bar: File, Edit, View, Insert, Format, Tools, Help */}
              <GoogleDocsMenuBar
                editor={editorInstance}
                title={title}
                onExport={handleExport}
                onPrint={handlePrint}
                onNewDocument={() => router.push("/")}
                onOpenDashboard={() => router.push("/")}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                isSidebarOpen={isSidebarOpen}
                showRuler={showRuler}
                onToggleRuler={() => setShowRuler((prev) => !prev)}
                showHeader={showHeader}
                onToggleHeader={() => setShowHeader((prev) => !prev)}
                showFooter={showFooter}
                onToggleFooter={() => setShowFooter((prev) => !prev)}
                onOpenWordCount={() => setIsWordCountOpen(true)}
                onOpenComments={() => setIsCommentsOpen(true)}
                onOpenPageNumbers={() => setIsPageNumberModalOpen(true)}
                onToggleAi={() => setIsAiSidebarOpen((prev) => !prev)}
                isAiOpen={isAiSidebarOpen}
              />
            </div>
          </div>

          {/* Right: Presence Avatars + Comments + Attachments + Gemini AI + Google Docs Share Pill */}
          <div className="flex items-center space-x-2">
            {/* Live presence avatar stack */}
            <ActiveAvatars />

            {/* Comments button */}
            <button
              onClick={() => setIsCommentsOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
              title="Open comments"
            >
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </button>

            {/* Attachments drawer button */}
            <button
              onClick={() => setIsAttachmentsOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
              title="Attachments"
            >
              <Paperclip className="h-4 w-4 text-slate-500" />
            </button>

            {/* Hanoi AI Assistant Pill Button */}
            <button
              onClick={() => setIsAiSidebarOpen((prev) => !prev)}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
                isAiSidebarOpen
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100"
              }`}
              title="Hanoi AI Assistant (Ctrl+J)"
            >
              <Sparkles
                className={`h-3.5 w-3.5 ${isAiSidebarOpen ? "text-white" : "text-indigo-600 animate-pulse"}`}
              />
              <span className="hidden sm:inline font-medium">Hanoi AI</span>
            </button>

            {/* Google Docs Primary Share Pill Button */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center space-x-1.5 rounded-full bg-[#c2e7ff] text-[#001d35] px-4 py-2 text-xs font-semibold hover:bg-[#b3dcf7] transition shadow-xs"
              title="Share document"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* 2. GOOGLE DOCS ACTION TOOLBAR RIBBON */}
        <GoogleDocsToolbar
          editor={editorInstance}
          onPrint={handlePrint}
          onOpenComments={() => setIsCommentsOpen(true)}
          zoom={zoom}
          onZoomChange={setZoom}
          onToggleAi={() => setIsAiSidebarOpen((prev) => !prev)}
          isAiOpen={isAiSidebarOpen}
        />
      </header>

      {/* 3. MAIN WORKSPACE WITH LEFT SIDEBAR (TABS & OUTLINE) AND CANVAS */}
      <div className="flex flex-1 relative">
        {/* Left Side Toggle Button (when sidebar is closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-2 top-[120px] z-30 p-2 bg-white rounded-full border border-slate-200 shadow-md text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition print:hidden"
            title="Show document tabs and outline"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* Document Tabs Sidebar */}
        <DocumentOutlineSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onAddTab={handleAddTab}
          onRenameTab={handleRenameTab}
          onDeleteTab={handleDeleteTab}
        />

        {/* Editor Sheet Canvas Area */}
        <main className="flex-1 flex flex-col items-center print:p-0 print:m-0 print:w-full print:block print:bg-white relative">
          {/* Floating AI Suggestion Decision Pill */}
          {activeAiSuggestion && (
            <div className="sticky top-2 z-30 mb-2 flex items-center justify-between rounded-full bg-slate-900/95 backdrop-blur-md text-white px-4 py-1.5 shadow-xl border border-indigo-400/40 max-w-xl mx-auto w-[90%] sm:w-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2 truncate pr-3">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse shrink-0" />
                <span className="text-xs truncate font-medium">
                  Hanoi AI suggested:{" "}
                  <strong className="text-indigo-200">
                    {activeAiSuggestion.summary}
                  </strong>
                </span>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => suggestionDecisionRef.current?.("accept")}
                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold shadow-xs transition active:scale-95"
                  title="Accept suggestion"
                >
                  <Check className="h-3 w-3" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => suggestionDecisionRef.current?.("reject")}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-full text-xs font-medium transition active:scale-95"
                  title="Reject suggestion"
                >
                  <X className="h-3 w-3" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          <TipTapEditor
            initialContent={document.content}
            rawHtml={document.content?.rawHtml}
            editable={role !== "VIEWER"}
            onContentChange={handleContentChange}
            onEditorReady={setEditorInstance}
            showRuler={showRuler}
            showHeader={showHeader}
            showFooter={showFooter}
            zoom={zoom}
            leftMargin={leftMargin}
            rightMargin={rightMargin}
            onMarginsChange={(left, right) => {
              setLeftMargin(left);
              setRightMargin(right);
            }}
            pageNumberSettings={pageNumberSettings}
          />
        </main>

        {/* Right Side Toggle Button (when Hanoi AI sidebar is closed) */}
        {!isAiSidebarOpen && (
          <button
            onClick={() => setIsAiSidebarOpen(true)}
            className="fixed right-2 top-[120px] z-30 p-2 bg-white rounded-full border border-slate-200 shadow-md text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition print:hidden group"
            title="Open Hanoi AI Assistant"
          >
            <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Right Sidebar: Hanoi AI Assistant (Docked symmetrically with Document Tabs) */}
        <AiAgentSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
          editor={editorInstance}
          documentTitle={title}
          documentId={documentId}
          userId={user?.id}
          userEmail={user?.primaryEmailAddress?.emailAddress}
          userName={user?.fullName || ""}
          onActiveSuggestionChange={setActiveAiSuggestion}
          onSuggestionDecisionRef={suggestionDecisionRef}
        />
      </div>

      {/* Modals & Overlays */}
      <ShareModal
        documentId={documentId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        collaborators={document.collaborators}
      />

      <CommentsOverlay
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
      />

      <AttachmentsDrawer
        documentId={documentId}
        isOpen={isAttachmentsOpen}
        onClose={() => setIsAttachmentsOpen(false)}
        canEdit={role !== "VIEWER"}
      />

      <WordCountModal
        isOpen={isWordCountOpen}
        onClose={() => setIsWordCountOpen(false)}
        editor={editorInstance}
      />

      <PageNumberModal
        isOpen={isPageNumberModalOpen}
        onClose={() => setIsPageNumberModalOpen(false)}
        currentSettings={pageNumberSettings}
        onApply={(settings) => setPageNumberSettings(settings)}
      />
    </div>
  );
}

function DocumentEditorContent() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const documentId = params?.id as string;

  const [document, setDocument] = useState<any>(null);
  const [role, setRole] = useState<string>("OWNER");
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Fetch document only once on mount
  useEffect(() => {
    if (!documentId || hasLoadedRef.current) return;

    async function loadDoc() {
      try {
        const token = await getToken();
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        const res = await apiFetch(`/api/documents/${documentId}`, {
          token,
          devUser: user
            ? { id: user.id, email: userEmail || "", name: user.fullName || "" }
            : undefined,
        });

        setDocument(res.document);
        setRole(res.role || "OWNER");
        hasLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to load document:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (user !== undefined) {
      loadDoc();
    }
  }, [documentId, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafd] text-slate-500 font-medium text-sm">
        Opening document...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#f8fafd] gap-4">
        <p className="text-slate-600 font-medium">
          Document not found or access denied.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <LiveblocksWrapper roomId={documentId}>
      <DocumentWorkspace
        initialDocument={document}
        role={role}
        documentId={documentId}
      />
    </LiveblocksWrapper>
  );
}

export default function DocumentEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f8fafd] text-slate-400">
          Loading editor...
        </div>
      }
    >
      <DocumentEditorContent />
    </Suspense>
  );
}
