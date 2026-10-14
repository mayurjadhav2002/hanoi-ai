"use client";

import { X } from "lucide-react";

interface WordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: any;
}

export function WordCountModal({ isOpen, onClose, editor }: WordCountModalProps) {
  if (!isOpen || !editor) return null;

  const text = editor.getText() || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, "").length;
  const paragraphs = editor.getJSON()?.content?.length || 1;
  const pages = Math.max(1, Math.ceil(words / 450));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Word count</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-sm">
          <div className="flex justify-between items-center text-slate-700">
            <span>Pages</span>
            <span className="font-semibold">{pages}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Words</span>
            <span className="font-semibold">{words.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Characters</span>
            <span className="font-semibold">{characters.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Characters excluding spaces</span>
            <span className="font-semibold">{charactersNoSpaces.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Paragraphs</span>
            <span className="font-semibold">{paragraphs}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
