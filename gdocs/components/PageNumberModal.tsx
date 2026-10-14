"use client";

import { useState, useEffect } from "react";
import { X, Hash, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export interface PageNumberSettings {
  position: "header" | "footer";
  alignment: "left" | "center" | "right";
  showOnFirstPage: boolean;
  startAt: number;
  format: "numbers" | "roman" | "letters";
}

interface PageNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: PageNumberSettings | null;
  onApply: (settings: PageNumberSettings | null) => void;
}

export function PageNumberModal({
  isOpen,
  onClose,
  currentSettings,
  onApply,
}: PageNumberModalProps) {
  const [position, setPosition] = useState<"header" | "footer">(
    currentSettings?.position || "footer"
  );
  const [alignment, setAlignment] = useState<"left" | "center" | "right">(
    currentSettings?.alignment || "right"
  );
  const [showOnFirstPage, setShowOnFirstPage] = useState<boolean>(
    currentSettings ? currentSettings.showOnFirstPage : true
  );
  const [startAt, setStartAt] = useState<number>(
    currentSettings?.startAt || 1
  );
  const [format, setFormat] = useState<"numbers" | "roman" | "letters">(
    currentSettings?.format || "numbers"
  );

  useEffect(() => {
    if (currentSettings) {
      setPosition(currentSettings.position);
      setAlignment(currentSettings.alignment);
      setShowOnFirstPage(currentSettings.showOnFirstPage);
      setStartAt(currentSettings.startAt);
      setFormat(currentSettings.format);
    } else {
      setPosition("footer");
      setAlignment("right");
      setShowOnFirstPage(true);
      setStartAt(1);
      setFormat("numbers");
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      position,
      alignment,
      showOnFirstPage,
      startAt: Math.max(1, Number(startAt) || 1),
      format,
    });
    onClose();
  };

  const handleRemove = () => {
    onApply(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Hash className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Page numbers</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5 text-xs text-slate-700">
          {/* Position Selector */}
          <div>
            <label className="block font-semibold text-slate-800 mb-2">
              Position
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border cursor-pointer transition ${
                  position === "header"
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 font-semibold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="position"
                  checked={position === "header"}
                  onChange={() => setPosition("header")}
                  className="hidden"
                />
                <span>Header (Top)</span>
              </label>

              <label
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border cursor-pointer transition ${
                  position === "footer"
                    ? "border-blue-600 bg-blue-50/70 text-blue-700 font-semibold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="position"
                  checked={position === "footer"}
                  onChange={() => setPosition("footer")}
                  className="hidden"
                />
                <span>Footer (Bottom)</span>
              </label>
            </div>
          </div>

          {/* Alignment Selector */}
          <div>
            <label className="block font-semibold text-slate-800 mb-2">
              Alignment
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAlignment("left")}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border transition ${
                  alignment === "left"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                <span>Left</span>
              </button>

              <button
                type="button"
                onClick={() => setAlignment("center")}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border transition ${
                  alignment === "center"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <AlignCenter className="h-3.5 w-3.5" />
                <span>Center</span>
              </button>

              <button
                type="button"
                onClick={() => setAlignment("right")}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border transition ${
                  alignment === "right"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <AlignRight className="h-3.5 w-3.5" />
                <span>Right</span>
              </button>
            </div>
          </div>

          {/* First Page Checkbox */}
          <div className="flex items-center space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="showOnFirstPage"
              checked={showOnFirstPage}
              onChange={(e) => setShowOnFirstPage(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showOnFirstPage" className="cursor-pointer font-medium text-slate-700">
              Show on first page
            </label>
          </div>

          {/* Numbering format & Start At */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Start at
              </label>
              <input
                type="number"
                min={1}
                value={startAt}
                onChange={(e) => setStartAt(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Numbering format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="numbers">1, 2, 3...</option>
                <option value="roman">i, ii, iii...</option>
                <option value="letters">A, B, C...</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {currentSettings && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
              >
                Remove page numbers
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
