"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Plus,
  FolderPlus,
  Search,
  Filter,
  ArrowUpDown,
  Folder,
  Share2,
  Check,
  CheckCircle,
  XCircle,
  FileUp,
  Clock,
  User,
  Trash2,
  MoreVertical,
  Loader2,
  Edit2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { ImportModal } from "@/components/ImportModal";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const {
    documents,
    folders,
    invitations,
    activeFilter,
    selectedFolderId,
    searchQuery,
    sortBy,
    isLoading,
    setDocuments,
    setFolders,
    setInvitations,
    setActiveFilter,
    setSelectedFolderId,
    setSearchQuery,
    setSortBy,
    setIsLoading,
  } = useAppStore();

  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeFolderMenu, setActiveFolderMenu] = useState<string | null>(null);
  const [activeDocMenu, setActiveDocMenu] = useState<string | null>(null);
  const [actionLoadingMessage, setActionLoadingMessage] = useState<
    string | null
  >(null);
  const [acceptingInviteToken, setAcceptingInviteToken] = useState<
    string | null
  >(null);
  const [decliningInviteToken, setDecliningInviteToken] = useState<
    string | null
  >(null);

  // Fetch documents, folders, and pending invites
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const userEmail =
        user?.primaryEmailAddress?.emailAddress || "owner@hanoiai.app";
      const userPayload = user
        ? { id: user.id, email: userEmail, name: user.fullName || undefined }
        : undefined;

      // 1. Fetch folders
      const foldersRes = await apiFetch("/api/folders", {
        token,
        devUser: userPayload,
      });
      setFolders(foldersRes.folders || []);

      // 2. Fetch documents
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (selectedFolderId) queryParams.set("folderId", selectedFolderId);
      if (activeFilter !== "all") queryParams.set("filter", activeFilter);
      if (sortBy) queryParams.set("sortBy", sortBy);

      const docsRes = await apiFetch(
        `/api/documents?${queryParams.toString()}`,
        {
          token,
          devUser: userPayload,
        },
      );
      setDocuments(docsRes.documents || []);

      // 3. Fetch pending invitations for this user
      const invitesRes = await apiFetch("/api/invitations/pending", {
        token,
        devUser: userPayload,
      });
      setInvitations(invitesRes.invitations || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user !== undefined) {
      fetchData();
    }
  }, [user, activeFilter, selectedFolderId, searchQuery, sortBy]);

  // Create new blank document
  const handleCreateDocument = async () => {
    setIsCreatingDoc(true);
    setActionLoadingMessage("Creating new document...");
    try {
      const token = await getToken();
      const res = await apiFetch("/api/documents", {
        method: "POST",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
        body: JSON.stringify({
          title: "Untitled Document",
          folderId: selectedFolderId,
        }),
      });

      if (res.document?.id) {
        setActionLoadingMessage("Opening document editor...");
        router.push(`/documents/${res.document.id}`);
      }
    } catch (err) {
      console.error("Create document failed:", err);
      setActionLoadingMessage(null);
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setActionLoadingMessage("Creating folder...");
    try {
      const token = await getToken();
      await apiFetch("/api/folders", {
        method: "POST",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      setNewFolderName("");
      setIsCreatingFolder(false);
      await fetchData();
    } catch (err) {
      console.error("Create folder failed:", err);
    } finally {
      setActionLoadingMessage(null);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this folder? Documents in this folder will be unassigned but not deleted.",
      )
    )
      return;

    setActionLoadingMessage("Deleting folder...");
    try {
      const token = await getToken();
      await apiFetch(`/api/folders/${folderId}`, {
        method: "DELETE",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
      });
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      setActiveFolderMenu(null);
      await fetchData();
    } catch (err) {
      console.error("Delete folder failed:", err);
    } finally {
      setActionLoadingMessage(null);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;

    setActionLoadingMessage("Deleting document...");
    try {
      const token = await getToken();
      await apiFetch(`/api/documents/${docId}`, {
        method: "DELETE",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
      });
      setActiveDocMenu(null);
      await fetchData();
    } catch (err) {
      console.error("Delete document failed:", err);
    } finally {
      setActionLoadingMessage(null);
    }
  };

  // Accept pending invitation
  const handleAcceptInvite = async (tokenParam: string) => {
    setAcceptingInviteToken(tokenParam);
    setActionLoadingMessage(
      "Accepting invitation & granting document access...",
    );
    try {
      const token = await getToken();
      const res = await apiFetch(`/api/invitations/${tokenParam}/accept`, {
        method: "POST",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
      });
      if (res.documentId) {
        setActionLoadingMessage("Opening document editor...");
        router.push(`/documents/${res.documentId}`);
      } else {
        setActionLoadingMessage(null);
        setAcceptingInviteToken(null);
        fetchData();
      }
    } catch (err: any) {
      console.error("Accept invite error:", err);
      setActionLoadingMessage(null);
      setAcceptingInviteToken(null);
      alert(err?.message || "Failed to accept invitation.");
    }
  };

  // Decline pending invitation
  const handleDeclineInvite = async (tokenParam: string) => {
    setDecliningInviteToken(tokenParam);
    setActionLoadingMessage("Declining invitation...");
    try {
      const token = await getToken();
      await apiFetch(`/api/invitations/${tokenParam}/decline`, {
        method: "POST",
        token,
        devUser: user
          ? {
              id: user.id,
              email: user?.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            }
          : undefined,
      });
      await fetchData();
    } catch (err: any) {
      console.error("Decline invite error:", err);
      alert(err?.message || "Failed to decline invitation.");
    } finally {
      setActionLoadingMessage(null);
      setDecliningInviteToken(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shadow-xs">
        <div>
          {/* Brand */}
          <div className="flex items-center space-x-3 px-5 py-4 border-b border-slate-100">
            <Image
              src="/logo_transparent_bg.png"
              alt="Hanoi AI"
              width={34}
              height={34}
              className="h-8.5 w-auto object-contain shrink-0"
              priority
            />
            <div className="flex items-baseline space-x-1.5 select-none">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
                Hanoi
              </span>
              <span className="text-xl font-medium text-slate-500 tracking-tight font-sans">
                AI
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleCreateDocument}
              disabled={isCreatingDoc}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isCreatingDoc ? "Creating..." : "New Document"}</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex w-full items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <FileUp className="h-4 w-4 text-slate-500" />
              <span>Import File (.docx, .md)</span>
            </button>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="px-4 py-2 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Views
            </p>
            <button
              onClick={() => {
                setActiveFilter("all");
                setSelectedFolderId(null);
              }}
              className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeFilter === "all" && !selectedFolderId
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>All Documents</span>
            </button>
            <button
              onClick={() => {
                setActiveFilter("owned");
                setSelectedFolderId(null);
              }}
              className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeFilter === "owned"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Owned by me</span>
            </button>
            <button
              onClick={() => {
                setActiveFilter("shared");
                setSelectedFolderId(null);
              }}
              className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                activeFilter === "shared"
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Share2 className="h-4 w-4" />
              <span>Shared with me</span>
            </button>
          </div>

          {/* Folders Section */}
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Folders
              </span>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="text-slate-400 hover:text-blue-600"
                title="Create Folder"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>

            {isCreatingFolder && (
              <form onSubmit={handleCreateFolder} className="mb-2 px-1">
                <input
                  type="text"
                  placeholder="Folder name..."
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  onBlur={() => {
                    if (!newFolderName) setIsCreatingFolder(false);
                  }}
                />
              </form>
            )}

            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {folders.map((f) => (
                <div
                  key={f.id}
                  className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    selectedFolderId === f.id
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <button
                    onClick={() => setSelectedFolderId(f.id)}
                    className="flex items-center space-x-2 truncate flex-1 text-left"
                  >
                    <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {f._count && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {f._count.documents}
                      </span>
                    )}

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFolderMenu(
                            activeFolderMenu === f.id ? null : f.id,
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-500 transition"
                        title="Folder options"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>

                      {activeFolderMenu === f.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-32 rounded-lg bg-white p-1 shadow-lg border border-slate-200 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(f.id);
                            }}
                            className="flex w-full items-center space-x-1.5 rounded px-2 py-1.5 text-red-600 hover:bg-red-50 text-left font-medium"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserButton />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 leading-none truncate">
                {user?.fullName || user?.firstName || "My Account"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {user?.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Filter and Search Bar */}
        <div className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shadow-2xs">
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="updatedAt">Last Modified</option>
                <option value="title">Title (A-Z)</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Document Grid Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Pending Invitations Banner */}
          {invitations.length > 0 && (
            <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs">
              <div className="flex items-center space-x-2 mb-3">
                <Share2 className="h-4 w-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Pending Collaboration Invites ({invitations.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl bg-white p-3.5 shadow-xs border border-blue-100"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {inv.document.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By {inv.inviter.name || inv.inviter.email} • Role:{" "}
                        {inv.role}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        disabled={
                          !!acceptingInviteToken || !!decliningInviteToken
                        }
                        onClick={() => handleAcceptInvite(inv.token)}
                        className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition flex items-center space-x-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                      >
                        {acceptingInviteToken === inv.token ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Accepting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                      <button
                        disabled={
                          !!acceptingInviteToken || !!decliningInviteToken
                        }
                        onClick={() => handleDeclineInvite(inv.token)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                      >
                        {decliningInviteToken === inv.token ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                            <span>Declining...</span>
                          </>
                        ) : (
                          <span>Decline</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {selectedFolderId
                ? `Folder: ${folders.find((f) => f.id === selectedFolderId)?.name || "Selected Folder"}`
                : activeFilter === "owned"
                  ? "My Documents"
                  : activeFilter === "shared"
                    ? "Shared With Me"
                    : "Recent Documents"}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {documents.length} document{documents.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Document Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-44 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-1/3 pt-2" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">
                No documents found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Create a new document or import an existing .docx or .md file to
                start collaborating.
              </p>
              <button
                onClick={handleCreateDocument}
                className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Create Document</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex items-center space-x-1">
                        {doc.folder && (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200/60 truncate max-w-[100px]">
                            {doc.folder.name}
                          </span>
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDocMenu(
                                activeDocMenu === doc.id ? null : doc.id,
                              );
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                            title="Document options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeDocMenu === doc.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-32 rounded-lg bg-white p-1 shadow-lg border border-slate-200 text-xs">
                              <button
                                onClick={(e) => handleDeleteDocument(doc.id, e)}
                                className="flex w-full items-center space-x-1.5 rounded px-2 py-1.5 text-red-600 hover:bg-red-50 text-left font-medium"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {doc.plainText || "Empty document"}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-medium text-slate-600 truncate max-w-[90px]">
                      {doc.owner?.name ||
                        doc.owner?.email?.split("@")[0] ||
                        "Owner"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Global Action Loading Modal / Screen */}
      {actionLoadingMessage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="flex items-center space-x-3 rounded-2xl bg-white px-6 py-4 shadow-xl border border-slate-100">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm font-semibold text-slate-800">
              {actionLoadingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Import File Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        folderId={selectedFolderId}
        onImportComplete={(id) => router.push(`/documents/${id}`)}
      />
    </div>
  );
}
