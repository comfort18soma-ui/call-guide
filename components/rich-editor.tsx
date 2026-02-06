"use client";

import { useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import {
  Bold,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ImagePlus,
  Highlighter,
  Eraser,
  Square,
  Link as LinkIcon,
  CodeXml,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BUCKET = "news-images";

/** アップロード用に英数字のみの安全なファイル名を生成（日本語ファイル名による Failed to fetch を防ぐ） */
function createSafeFileName(originalName: string): string {
  const rawExt = originalName.split(".").pop()?.toLowerCase() ?? "";
  const fileExt = /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";
  return `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
}

export type RichEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

function Toolbar({
  editor,
  onImageUploading,
  htmlMode,
  onToggleHtmlMode,
}: {
  editor: ReturnType<typeof useEditor>["editor"];
  onImageUploading?: (uploading: boolean) => void;
  htmlMode?: boolean;
  onToggleHtmlMode?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const openLinkMode = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href ?? "";
    setLinkUrl(previousUrl);
    setIsLinkMode(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    const trimmed = linkUrl.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkMode(false);
      setLinkUrl("");
      return;
    }

    const finalUrl = trimmed.match(/^https?:\/\//) ? trimmed : `https://${trimmed}`;

    try {
      // 1. まずリンクを適用する
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: finalUrl })
        .run();

      // 2. カーソルを選択範囲の末尾（リンクの後ろ）に移動し、
      //    次に入力する文字からリンク属性を外す
      editor
        .chain()
        .setTextSelection(editor.state.selection.to)
        .unsetMark("link")
        .run();
    } catch (e) {
      console.error("Link set error:", e);
      alert("リンク設定中にエラーが発生しました");
    }

    setIsLinkMode(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const closeLinkMode = useCallback(() => {
    setIsLinkMode(false);
    setLinkUrl("");
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (!editor) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      alert("環境変数が読み込めていません。.env.local を確認してください。");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const filePath = createSafeFileName(file.name);

    onImageUploading?.(true);
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: false });

      if (error) {
        console.error("Upload Error:", error);
        alert(`アップロード失敗: ${error.message}`);
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      editor.chain().focus().setImage({ src: data.publicUrl }).run();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Image upload failed:", err);
      alert(`アップロード失敗: ${message}`);
    } finally {
      onImageUploading?.(false);
    }
  };

  if (!editor) return null;

  const btnBase =
    "p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors";
  const btnActive = "text-blue-400 hover:text-blue-300";

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-800 bg-zinc-900/80 p-1.5">
      <div className="flex flex-1 flex-wrap items-center gap-0.5">
      {/* 文字サイズ */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(btnBase, editor.isActive("heading", { level: 2 }) && btnActive)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="大 (H2)"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(btnBase, editor.isActive("heading", { level: 3 }) && btnActive)}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="中 (H3)"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(btnBase, editor.isActive("paragraph") && btnActive)}
        onClick={() => editor.chain().focus().setParagraph().run()}
        title="標準 (P)"
      >
        <Pilcrow className="h-4 w-4" />
      </Button>

      <span className="mx-1 w-px self-stretch bg-zinc-700" aria-hidden />

      {/* 文字装飾 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(btnBase, editor.isActive("bold") && btnActive)}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="太字 (B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          btnBase,
          editor.isActive("textStyle", { color: "#ef4444" }) && btnActive,
        )}
        onClick={() => editor.chain().focus().setColor("#ef4444").run()}
        title="赤文字"
      >
        <Square className="h-3.5 w-3.5 fill-red-500 text-red-500" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          btnBase,
          editor.isActive("textStyle", { color: "#3b82f6" }) && btnActive,
        )}
        onClick={() => editor.chain().focus().setColor("#3b82f6").run()}
        title="青文字"
      >
        <Square className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          btnBase,
          editor.isActive("highlight", { color: "#fde047" }) && btnActive,
        )}
        onClick={() =>
          editor.chain().focus().toggleHighlight({ color: "#fde047" }).run()
        }
        title="マーカー (黄)"
      >
        <Highlighter className="h-4 w-4 text-yellow-400" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnBase}
        onClick={() =>
          editor.chain().focus().unsetColor().unsetHighlight().run()
        }
        title="色リセット"
      >
        <Eraser className="h-4 w-4" />
      </Button>

      <span className="mx-1 w-px self-stretch bg-zinc-700" aria-hidden />

      {/* その他 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(btnBase, editor.isActive("bulletList") && btnActive)}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="箇条書き"
      >
        <List className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnBase}
        onClick={handleImageClick}
        title="画像を挿入"
      >
        <ImagePlus className="h-4 w-4" />
      </Button>
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            openLinkMode();
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            btnBase,
            (editor.isActive("link") || isLinkMode)
              ? "text-blue-400 hover:text-blue-300"
              : "text-zinc-400 hover:text-zinc-100",
          )}
          title="リンクを挿入"
        >
          <LinkIcon className="h-5 w-5" />
        </button>
        {isLinkMode ? (
          <div className="absolute left-0 top-full z-50 mt-1 flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800 p-1 shadow-lg">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-48 border-none bg-zinc-900 px-2 py-1 text-xs text-white focus:ring-1 focus:ring-blue-500 rounded"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") closeLinkMode();
              }}
            />
            <button
              type="button"
              onClick={applyLink}
              className="rounded p-1 text-green-400 hover:bg-zinc-700"
              title="決定"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={closeLinkMode}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-700"
              title="キャンセル"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
      </div>
      {onToggleHtmlMode != null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(btnBase, "ml-auto", htmlMode && btnActive)}
          onClick={onToggleHtmlMode}
          title={htmlMode ? "見たまま編集に戻る" : "HTMLを直接編集"}
        >
          <CodeXml className="h-4 w-4" />
          <span className="ml-1 text-xs">{htmlMode ? "編集" : "HTML"}</span>
        </Button>
      )}
    </div>
  );
}

export function RichEditor({ content, onChange }: RichEditorProps) {
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-blue-400 underline" },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-md h-auto",
        },
      }),
      Youtube.configure({ controls: true }),
      Placeholder.configure({ placeholder: "本文を入力..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[500px] p-3 text-zinc-100 text-sm [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:my-0.5 [&_a]:text-blue-400 [&_a]:underline [&_a]:cursor-pointer [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-2 [&_mark]:rounded [&_mark]:px-0.5",
      },
    },
  });

  const handleToggleHtmlMode = () => {
    if (htmlMode) {
      editor?.commands.setContent(htmlContent);
      onChange(htmlContent);
      setHtmlMode(false);
    } else {
      if (editor) {
        setHtmlContent(editor.getHTML());
        setHtmlMode(true);
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
      <Toolbar
        editor={editor}
        htmlMode={htmlMode}
        onToggleHtmlMode={handleToggleHtmlMode}
      />
      {htmlMode ? (
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="min-h-[500px] w-full resize-y border-0 bg-zinc-900/50 p-3 font-mono text-sm text-zinc-100 focus:outline-none"
          placeholder="HTMLを直接編集..."
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
