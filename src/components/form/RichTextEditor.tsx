"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  RotateCcw,
  RemoveFormatting
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write description here...",
  minHeight = "120px",
  className = ""
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        link: false,
        underline: false
      }),
      Underline,
      Placeholder.configure({
        placeholder
      }),
      Link.configure({
        openOnClick: false
      })
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert prose-xs sm:prose-sm max-w-none p-3 outline-none focus:outline-none min-h-[${minHeight}] text-xs leading-relaxed dark:text-gray-200 text-gray-800`
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // If empty paragraph, pass empty string
      if (html === "<p></p>") {
        onChange("");
      } else {
        onChange(html);
      }
    },
    immediatelyRender: false
  });

  // Sync external value changes if needed (without breaking active cursor)
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      const cleanIncoming = value || "";
      const cleanCurrent = currentHtml === "<p></p>" ? "" : currentHtml;
      if (cleanIncoming !== cleanCurrent && !editor.isFocused) {
        editor.commands.setContent(cleanIncoming, { emitUpdate: false });
      }
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div 
        className={`w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-3 text-xs text-gray-400 ${className}`}
        style={{ minHeight }}
      >
        Loading rich text editor...
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xs overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 ${className}`}>
      {/* TipTap WYSIWYG Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("bold")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={13} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("italic")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={13} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("underline")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon size={13} />
        </button>

        {/* Strike */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("strike")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={13} />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-0.5" />

        {/* Heading 1 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("heading", { level: 1 })
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Heading 1"
        >
          <Heading1 size={13} />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("heading", { level: 2 })
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Heading 2"
        >
          <Heading2 size={13} />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("heading", { level: 3 })
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Heading 3"
        >
          <Heading3 size={13} />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-0.5" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("bulletList")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Bullet List"
        >
          <List size={13} />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("orderedList")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Numbered List"
        >
          <ListOrdered size={13} />
        </button>

        {/* Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            editor.isActive("blockquote")
              ? "bg-blue-600 text-white font-bold shadow-xs"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
          title="Blockquote"
        >
          <Quote size={13} />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-0.5" />

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded-lg text-xs text-gray-500 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Clear formatting"
        >
          <RemoveFormatting size={13} />
        </button>
      </div>

      {/* Editable Content */}
      <EditorContent 
        editor={editor} 
        style={{ minHeight }}
        className="cursor-text"
      />
    </div>
  );
};
export default RichTextEditor;
