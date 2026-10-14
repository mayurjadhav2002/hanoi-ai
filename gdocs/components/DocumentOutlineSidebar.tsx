"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";

export interface DocumentTab {
  id: string;
  name: string;
}

interface DocumentOutlineSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: DocumentTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab?: (id: string, newName: string) => void;
  onDeleteTab?: (id: string) => void;
}

export function DocumentOutlineSidebar({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
}: DocumentOutlineSidebarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (!isOpen) return null;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-[calc(100vh-106px)] sticky top-[106px] flex flex-col shrink-0 select-none z-20 shadow-xs print:hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-xs text-slate-800">
            Document Tabs ({tabs.length})
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="Close tabs sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tabs
          </span>
          <button
            onClick={onAddTab}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-50 rounded-md transition"
            title="Add new tab"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add tab</span>
          </button>
        </div>

        <div className="space-y-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            if (isEditing) {
              return (
                <div
                  key={tab.id}
                  className="flex items-center space-x-1.5 rounded-lg px-2 py-1.5 bg-blue-50/80 border border-blue-200"
                >
                  <input
                    type="text"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editName.trim() && onRenameTab) {
                          onRenameTab(tab.id, editName.trim());
                        }
                        setEditingTabId(null);
                      } else if (e.key === "Escape") {
                        setEditingTabId(null);
                      }
                    }}
                    className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-none font-medium"
                  />
                  <button
                    onClick={() => {
                      if (editName.trim() && onRenameTab) {
                        onRenameTab(tab.id, editName.trim());
                      }
                      setEditingTabId(null);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Save name"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={tab.id}
                className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <button
                  onClick={() => onSelectTab(tab.id)}
                  className="flex items-center space-x-2 flex-1 truncate text-left"
                >
                  <FileText
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{tab.name}</span>
                </button>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1">
                  {onRenameTab && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTabId(tab.id);
                        setEditName(tab.name);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                      title="Rename tab"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                  {tabs.length > 1 && onDeleteTab && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTab(tab.id);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Delete tab"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
