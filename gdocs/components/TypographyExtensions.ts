import { Extension, Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (font: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
    textColor: {
      setTextColor: (color: string) => ReturnType;
      unsetTextColor: () => ReturnType;
    };
    letterSpacing: {
      setLetterSpacing: (spacing: string) => ReturnType;
      unsetLetterSpacing: () => ReturnType;
    };
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const FontFamily = Mark.create({
  name: "fontFamily",
  addAttributes() {
    return {
      font: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontFamily,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.font) return {};
          return { style: `font-family: ${attributes.font}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*='font-family']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontFamily:
        (font: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { font }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

export const TextColor = Mark.create({
  name: "textColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*='color']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { color }).run();
        },
      unsetTextColor:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

export const LetterSpacing = Mark.create({
  name: "letterSpacing",
  addAttributes() {
    return {
      spacing: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.letterSpacing,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.spacing) return {};
          return { style: `letter-spacing: ${attributes.spacing}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*='letter-spacing']" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setLetterSpacing:
        (spacing: string) =>
        ({ chain }) => {
          return chain().setMark(this.name, { spacing }).run();
        },
      unsetLetterSpacing:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

export const LineHeight = Extension.create({
  name: "lineHeight",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.lineHeight,
            renderHTML: (attributes: Record<string, any>) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          return ["paragraph", "heading"].some((type) =>
            commands.updateAttributes(type, { lineHeight })
          );
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return ["paragraph", "heading"].some((type) =>
            commands.resetAttributes(type, "lineHeight")
          );
        },
    };
  },
});
