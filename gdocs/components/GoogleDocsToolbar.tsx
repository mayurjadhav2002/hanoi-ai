"use client";

import { useState, useRef, useEffect } from "react";
import {
  Undo,
  Redo,
  Printer,
  ChevronDown,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  MessageSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  RemoveFormatting,
  Plus,
  Minus,
  Check,
  MoveVertical,
  FoldHorizontal,
  Sparkles,
} from "lucide-react";

interface GoogleDocsToolbarProps {
  editor: any;
  onPrint: () => void;
  onOpenComments: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onToggleAi?: () => void;
  isAiOpen?: boolean;
}

const FONT_FAMILIES = [
  "Arial",
  "Roboto",
  "Inter",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Comic Sans MS",
  "Impact",
];

const TEXT_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#ffffff",
  "#ea4335",
  "#ff6d01",
  "#fbbc04",
  "#34a853",
  "#24c1e0",
  "#4285f4",
  "#a142f4",
  "#e91e63",
  "#980000",
  "#795548",
  "#827717",
  "#1b5e20",
  "#0d47a1",
  "#4a148c",
];

const HIGHLIGHT_COLORS = [
  "#fff59d", // Yellow
  "#c8e6c9", // Lime Green
  "#b2ebf2", // Light Cyan
  "#f8bbd0", // Light Pink
  "#e1bee7", // Lavender
  "#ffe0b2", // Peach
  "#ffcdd2", // Light Red
  "#bbdefb", // Sky Blue
  "#d1c4e9", // Violet
  "#dcedc8", // Pale Mint
];

export function GoogleDocsToolbar({
  editor,
  onPrint,
  onOpenComments,
  zoom,
  onZoomChange,
  onToggleAi,
  isAiOpen,
}: GoogleDocsToolbarProps) {
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [lineSpacingOpen, setLineSpacingOpen] = useState(false);
  const [letterSpacingOpen, setLetterSpacingOpen] = useState(false);

  const [currentFont, setCurrentFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(11);
  const [textColor, setTextColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#fff59d");
  const [lineHeight, setLineHeight] = useState("1.15");
  const [letterSpacing, setLetterSpacing] = useState("Normal");

  const styleMenuRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const textColorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const lineSpacingMenuRef = useRef<HTMLDivElement>(null);
  const letterSpacingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setStyleDropdownOpen(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setFontDropdownOpen(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setZoomDropdownOpen(false);
      }
      if (textColorMenuRef.current && !textColorMenuRef.current.contains(e.target as Node)) {
        setTextColorOpen(false);
      }
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(e.target as Node)) {
        setHighlightOpen(false);
      }
      if (lineSpacingMenuRef.current && !lineSpacingMenuRef.current.contains(e.target as Node)) {
        setLineSpacingOpen(false);
      }
      if (letterSpacingMenuRef.current && !letterSpacingMenuRef.current.contains(e.target as Node)) {
        setLetterSpacingOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md transition text-slate-700 hover:bg-slate-200/80 disabled:opacity-30 disabled:hover:bg-transparent ${
      active ? "bg-blue-100 text-blue-700 font-semibold" : ""
    }`;

  const getCurrentStyleLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    return "Normal text";
  };

  const handleFontSizeChange = (delta: number) => {
    const next = Math.min(72, Math.max(6, fontSize + delta));
    setFontSize(next);
    editor.chain().focus().setFontSize(`${next}pt`).run();
  };

  const handleFontSelect = (font: string) => {
    setCurrentFont(font);
    editor.chain().focus().setFontFamily(font).run();
    setFontDropdownOpen(false);
  };

  const handleTextColorSelect = (color: string) => {
    setTextColor(color);
    editor.chain().focus().setTextColor(color).run();
    setTextColorOpen(false);
  };

  const handleHighlightSelect = (color: string) => {
    setHighlightColor(color);
    editor.chain().focus().setHighlight({ color }).run();
    setHighlightOpen(false);
  };

  const handleLineHeightSelect = (lh: string) => {
    setLineHeight(lh);
    editor.chain().focus().setLineHeight(lh).run();
    setLineSpacingOpen(false);
  };

  const handleLetterSpacingSelect = (label: string, val: string) => {
    setLetterSpacing(label);
    if (val) {
      editor.chain().focus().setLetterSpacing(val).run();
    } else {
      editor.chain().focus().unsetLetterSpacing().run();
    }
    setLetterSpacingOpen(false);
  };

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-[#edf2fa] px-4 py-1 text-xs select-none">
      {/* 1. Undo & Redo & Print */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={btnClass(false)}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={btnClass(false)}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </button>
        <button onClick={onPrint} className={btnClass(false)} title="Print (Ctrl+P)">
          <Printer className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Zoom dropdown */}
      <div className="relative border-r border-slate-300 pr-1.5 mr-1" ref={zoomMenuRef}>
        <button
          onClick={() => setZoomDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-1 rounded px-2 py-1 text-slate-700 hover:bg-slate-200/80"
          title="Zoom"
        >
          <span>{zoom}%</span>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>

        {zoomDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-24 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
            {[75, 90, 100, 125, 150].map((z) => (
              <button
                key={z}
                onClick={() => {
                  onZoomChange(z);
                  setZoomDropdownOpen(false);
                }}
                className={`flex w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 ${
                  zoom === z ? "font-bold text-blue-600 bg-blue-50" : "text-slate-700"
                }`}
              >
                {z}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Styles Dropdown */}
      <div className="relative border-r border-slate-300 pr-1.5 mr-1" ref={styleMenuRef}>
        <button
          onClick={() => setStyleDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-1.5 rounded px-2.5 py-1 text-slate-700 hover:bg-slate-200/80 min-w-[105px] justify-between"
          title="Styles"
        >
          <span className="truncate font-medium">{getCurrentStyleLabel()}</span>
          <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
        </button>

        {styleDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg z-50">
            <button
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setStyleDropdownOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 rounded text-xs text-slate-800"
            >
              Normal text
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setStyleDropdownOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 rounded text-base font-bold text-slate-900"
            >
              Heading 1
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setStyleDropdownOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 rounded text-sm font-semibold text-slate-800"
            >
              Heading 2
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                setStyleDropdownOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-left hover:bg-slate-100 rounded text-xs font-semibold text-slate-800"
            >
              Heading 3
            </button>
          </div>
        )}
      </div>

      {/* 4. Font Family Selector */}
      <div className="relative border-r border-slate-300 pr-1.5 mr-1" ref={fontMenuRef}>
        <button
          onClick={() => setFontDropdownOpen((prev) => !prev)}
          className="flex items-center space-x-1.5 rounded px-2.5 py-1 text-slate-700 hover:bg-slate-200/80 min-w-[110px] justify-between"
          title="Font family"
        >
          <span className="truncate font-medium" style={{ fontFamily: currentFont }}>
            {currentFont}
          </span>
          <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" />
        </button>

        {fontDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
            {FONT_FAMILIES.map((font) => (
              <button
                key={font}
                onClick={() => handleFontSelect(font)}
                style={{ fontFamily: font }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left rounded text-xs hover:bg-slate-100 ${
                  currentFont === font ? "font-bold text-blue-600 bg-blue-50" : "text-slate-800"
                }`}
              >
                <span>{font}</span>
                {currentFont === font && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Font Size Stepper */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
        <button
          onClick={() => handleFontSizeChange(-1)}
          className={btnClass(false)}
          title="Decrease font size"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center font-semibold text-slate-800">{fontSize}</span>
        <button
          onClick={() => handleFontSizeChange(1)}
          className={btnClass(false)}
          title="Increase font size"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* 6. Basic Formatting (Bold, Italic, Underline, Strikethrough) */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive("strike"))}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
      </div>

      {/* 7. Text Color & Highlight Color */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
        {/* Text Color Picker */}
        <div className="relative" ref={textColorMenuRef}>
          <button
            onClick={() => setTextColorOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/80"
            title="Text color"
          >
            <span className="font-bold text-sm leading-tight text-slate-800">A</span>
            <div
              className="h-1 w-4 rounded-full mt-0.5"
              style={{ backgroundColor: textColor }}
            />
          </button>

          {textColorOpen && (
            <div className="absolute left-0 top-full mt-1 p-2 rounded-lg border border-slate-200 bg-white shadow-xl z-50 w-52">
              <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Text color
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleTextColorSelect(c)}
                    style={{ backgroundColor: c }}
                    className="h-5 w-5 rounded-full border border-slate-200 hover:scale-115 transition"
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative" ref={highlightMenuRef}>
          <button
            onClick={() => setHighlightOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center p-1 rounded hover:bg-slate-200/80"
            title="Highlight color"
          >
            <Highlighter className="h-4 w-4 text-slate-700" />
            <div
              className="h-1 w-4 rounded-full mt-0.5"
              style={{ backgroundColor: highlightColor }}
            />
          </button>

          {highlightOpen && (
            <div className="absolute left-0 top-full mt-1 p-2.5 rounded-lg border border-slate-200 bg-white shadow-xl z-50 w-52">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Highlight
                </span>
                <button
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setHighlightOpen(false);
                  }}
                  className="text-[10px] text-red-600 hover:underline font-semibold"
                >
                  None
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleHighlightSelect(c)}
                    style={{ backgroundColor: c }}
                    className="h-6 w-6 rounded-md border border-slate-300/80 hover:scale-115 transition"
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 8. Line Spacing & Letter Spacing */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
        {/* Line Spacing */}
        <div className="relative" ref={lineSpacingMenuRef}>
          <button
            onClick={() => setLineSpacingOpen((prev) => !prev)}
            className={btnClass(false)}
            title="Line spacing"
          >
            <MoveVertical className="h-4 w-4" />
          </button>

          {lineSpacingOpen && (
            <div className="absolute left-0 top-full mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Line spacing
              </div>
              {[
                { label: "Single (1.0)", value: "1.0" },
                { label: "1.15", value: "1.15" },
                { label: "1.5", value: "1.5" },
                { label: "Double (2.0)", value: "2.0" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleLineHeightSelect(item.value)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-100 ${
                    lineHeight === item.value ? "font-bold text-blue-600 bg-blue-50" : "text-slate-700"
                  }`}
                >
                  <span>{item.label}</span>
                  {lineHeight === item.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Letter Spacing */}
        <div className="relative" ref={letterSpacingMenuRef}>
          <button
            onClick={() => setLetterSpacingOpen((prev) => !prev)}
            className={btnClass(false)}
            title="Letter spacing (tracking)"
          >
            <FoldHorizontal className="h-4 w-4" />
          </button>

          {letterSpacingOpen && (
            <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Letter spacing
              </div>
              {[
                { label: "Normal (0px)", value: "" },
                { label: "Tight (-0.5px)", value: "-0.5px" },
                { label: "Wide (1px)", value: "1px" },
                { label: "Extra Wide (2px)", value: "2px" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleLetterSpacingSelect(item.label, item.value)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-100 ${
                    letterSpacing === item.label ? "font-bold text-blue-600 bg-blue-50" : "text-slate-700"
                  }`}
                >
                  <span>{item.label}</span>
                  {letterSpacing === item.label && <Check className="h-3.5 w-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 9. Alignment */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-1.5 mr-1">
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={btnClass(editor.isActive({ textAlign: "justify" }))}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
      </div>

      {/* 10. Lists, Comments & Tables */}
      <div className="flex items-center space-x-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive("bulletList"))}
          title="Bulleted list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive("orderedList"))}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive("blockquote"))}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          className={btnClass(false)}
          title="Insert table (3x3)"
        >
          <TableIcon className="h-4 w-4" />
        </button>
        <button onClick={onOpenComments} className={btnClass(false)} title="Add comment">
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className={btnClass(false)}
          title="Clear formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </button>
      </div>

      {/* 11. Hanoi AI Assistant Trigger */}
      {onToggleAi && (
        <div className="flex items-center pl-1 border-l border-slate-200">
          <button
            onClick={onToggleAi}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition shadow-2xs ${
              isAiOpen
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-purple-100"
            }`}
            title="Open Hanoi AI Document Assistant"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isAiOpen ? "text-white" : "text-indigo-600 animate-pulse"}`} />
            <span className="font-medium">Hanoi AI</span>
          </button>
        </div>
      )}
    </div>
  );
}
