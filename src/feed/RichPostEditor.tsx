import type { Editor } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Notice } from "../components/ui";
import {
  MAX_IMAGE_BYTES,
  MAX_POST_IMAGES,
  type PostImageAttachment,
  type RichDocument,
  type RichPostDraft,
} from "./richContent";
import "./RichPostEditor.css";

type RichPostEditorProps = {
  onChange: (draft: RichPostDraft) => void;
  disabled?: boolean;
};

type EditorToolProps = {
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
};

// Only this editor's selected files can create image nodes. Pasted HTML and
// Markdown image URLs never become image nodes that bypass local attachments.
const LocalImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      clientId: { default: null, rendered: false },
    };
  },
  parseHTML() {
    return [];
  },
  addInputRules() {
    return [];
  },
});

function EditorTool({ label, children, onClick, active, disabled }: EditorToolProps) {
  return (
    <button
      type="button"
      className={"rich-editor-tool" + (active ? " rich-editor-tool--active" : "")}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function EditorGlyph({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function countImages(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image") count += 1;
  });
  return count;
}

export default function RichPostEditor({
  onChange,
  disabled = false,
}: RichPostEditorProps) {
  const labelId = useId();
  const hintId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  const attachmentsRef = useRef(new Map<string, PostImageAttachment>());
  const previewUrlsRef = useRef(new Map<string, string>());
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      LocalImage.configure({ allowBase64: false }),
      Placeholder.configure({
        placeholder: "지금 나누고 싶은 이야기는 무엇인가요?",
      }),
    ],
    [],
  );

  const emitDraft = (currentEditor: Editor) => {
    const images: PostImageAttachment[] = [];
    const referencedIds = new Set<string>();
    currentEditor.state.doc.descendants((node) => {
      if (node.type.name !== "image") return;
      const clientId: unknown = node.attrs.clientId;
      if (typeof clientId !== "string" || referencedIds.has(clientId)) return;
      const attachment = attachmentsRef.current.get(clientId);
      if (attachment) {
        referencedIds.add(clientId);
        images.push(attachment);
      }
    });
    onChangeRef.current({
      contentJson: currentEditor.getJSON(),
      text: currentEditor.getText({ blockSeparator: "\n" }),
      images,
    });
  };

  const insertFiles = (files: File[], position?: number) => {
    const currentEditor = editorRef.current;
    if (!currentEditor || !currentEditor.isEditable || disabledRef.current || files.length === 0) return;
    if (countImages(currentEditor) + files.length > MAX_POST_IMAGES) {
      setImageError(`이미지는 최대 ${MAX_POST_IMAGES}장까지 넣을 수 있어요. 먼저 본문의 이미지를 삭제해 주세요.`);
      return;
    }
    if (files.some((file) => file.type !== "image/jpeg" && file.type !== "image/png")) {
      setImageError("JPEG 또는 PNG 이미지 파일을 선택해 주세요.");
      return;
    }
    if (files.some((file) => file.size === 0 || file.size > MAX_IMAGE_BYTES)) {
      setImageError("이미지는 비어 있지 않은 파일로, 한 장당 5MB 이내여야 해요.");
      return;
    }

    const addedIds: string[] = [];
    try {
      const nodes: RichDocument[] = files.map((file) => {
        const clientId = crypto.randomUUID();
        const src = URL.createObjectURL(file);
        attachmentsRef.current.set(clientId, { clientId, file });
        previewUrlsRef.current.set(clientId, src);
        addedIds.push(clientId);
        return { type: "image", attrs: { clientId, src, alt: file.name } };
      });
      const chain = currentEditor.chain().focus();
      const inserted = position === undefined
        ? chain.insertContent(nodes).run()
        : chain.insertContentAt(position, nodes).run();
      if (!inserted) throw new Error("Image insertion failed");
      setImageError(null);
    } catch {
      for (const clientId of addedIds) {
        const url = previewUrlsRef.current.get(clientId);
        if (url) URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(clientId);
        attachmentsRef.current.delete(clientId);
      }
      setImageError("이미지를 넣지 못했어요. 파일을 확인한 뒤 다시 시도해 주세요.");
    }
  };

  const editor = useEditor({
    extensions,
    content: { type: "doc", content: [{ type: "paragraph" }] },
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: !disabled,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        "aria-describedby": hintId,
        "aria-readonly": String(disabled),
      },
      handlePaste: (_view, event, slice) => {
        if (disabledRef.current) return true;
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length > 0) {
          event.preventDefault();
          insertFiles(files);
          return true;
        }
        let hasImage = false;
        slice.content.descendants((node) => {
          if (node.type.name === "image") hasImage = true;
        });
        if (hasImage) {
          setImageError("이미지는 JPEG 또는 PNG 파일로 추가해 주세요.");
          return true;
        }
        if (/<img\b/i.test(event.clipboardData?.getData("text/html") ?? "")) {
          setImageError("외부 이미지는 붙여넣기에서 제외했어요. 이미지 파일로 추가해 주세요.");
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (disabledRef.current) return true;
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length > 0) {
          event.preventDefault();
          const target = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (target) insertFiles(files, target.pos);
          else setImageError("이미지를 넣을 본문 위치에 다시 놓아주세요.");
          return true;
        }
        let hasImage = false;
        slice.content.descendants((node) => {
          if (node.type.name === "image") hasImage = true;
        });
        if (hasImage) {
          setImageError("이미지는 JPEG 또는 PNG 파일로 추가해 주세요.");
          return true;
        }
        if (/<img\b/i.test(event.dataTransfer?.getData("text/html") ?? "")) {
          setImageError("외부 이미지는 넣지 않았어요. 이미지 파일을 선택해 주세요.");
        }
        return false;
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      editorRef.current = currentEditor;
      emitDraft(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => emitDraft(currentEditor),
  });

  useEffect(() => {
    editorRef.current = editor;
    disabledRef.current = disabled;
    editor?.setEditable(!disabled, false);
  }, [disabled, editor]);

  useEffect(() => {
    const attachments = attachmentsRef.current;
    const previews = previewUrlsRef.current;
    return () => {
      for (const url of previews.values()) URL.revokeObjectURL(url);
      previews.clear();
      attachments.clear();
    };
  }, []);

  const imageCount = editor ? countImages(editor) : 0;
  const toolbarDisabled = disabled || !editor;

  return (
    <div className={"rich-post-field" + (disabled ? " rich-post-field--disabled" : "")}>
      <div className="rich-post-field__heading">
        <span id={labelId} className="rich-post-field__label">본문</span>
        <span className="rich-post-field__count" aria-live="polite">이미지 {imageCount} / {MAX_POST_IMAGES}</span>
      </div>

      <div className="rich-post-editor">
        <div className="rich-post-toolbar" role="toolbar" aria-label="본문 서식">
          <div className="rich-post-toolbar__group">
            <EditorTool label="굵게" active={editor?.isActive("bold") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleBold().run()}>
              <strong className="rich-editor-tool__letter">B</strong>
            </EditorTool>
            <EditorTool label="기울임" active={editor?.isActive("italic") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleItalic().run()}>
              <em className="rich-editor-tool__letter">I</em>
            </EditorTool>
            <EditorTool label="밑줄" active={editor?.isActive("underline") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
              <span className="rich-editor-tool__letter rich-editor-tool__letter--underline">U</span>
            </EditorTool>
            <EditorTool label="취소선" active={editor?.isActive("strike") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleStrike().run()}>
              <span className="rich-editor-tool__letter rich-editor-tool__letter--strike">S</span>
            </EditorTool>
            <EditorTool label="인라인 코드" active={editor?.isActive("code") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleCode().run()}>
              <EditorGlyph path="m8 6-6 6 6 6m8-12 6 6-6 6" />
            </EditorTool>
          </div>
          <div className="rich-post-toolbar__group">
            <EditorTool label="소제목" active={editor?.isActive("heading", { level: 2 }) ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
              <span className="rich-editor-tool__heading">H2</span>
            </EditorTool>
            <EditorTool label="글머리 기호 목록" active={editor?.isActive("bulletList") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
              <EditorGlyph path="M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01" />
            </EditorTool>
            <EditorTool label="인용문" active={editor?.isActive("blockquote") ?? false} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
              <EditorGlyph path="M4 5h6v7H4Zm10 0h6v7h-6ZM10 12c0 4-2 6-5 7m15-7c0 4-2 6-5 7" />
            </EditorTool>
          </div>
          <div className="rich-post-toolbar__group">
            <EditorTool label="이미지 추가" disabled={toolbarDisabled || imageCount >= MAX_POST_IMAGES} onClick={() => fileInputRef.current?.click()}>
              <EditorGlyph path="M3 3h18v18H3Zm0 13 5-5 5 5 3-3 5 5M14 8h.01" />
            </EditorTool>
            <EditorTool label="실행 취소" disabled={toolbarDisabled || !editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
              <EditorGlyph path="M3 7v6h6M3 13a8 8 0 1 1 2 7" />
            </EditorTool>
            <EditorTool label="다시 실행" disabled={toolbarDisabled || !editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
              <EditorGlyph path="M21 7v6h-6M21 13a8 8 0 1 0-2 7" />
            </EditorTool>
          </div>
        </div>

        <EditorContent editor={editor} className="rich-post-editor__body" />
        {!editor && <div className="rich-post-editor__loading" role="status">에디터를 준비하고 있어요...</div>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        disabled={toolbarDisabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          insertFiles(files);
        }}
      />
      <p id={hintId} className="rich-post-field__hint">
        JPEG·PNG, 한 장당 5MB 이내 · 최대 {MAX_POST_IMAGES}장. 이미지는 선택 후 Backspace로 삭제할 수 있어요.
      </p>
      {imageError && <Notice>{imageError}</Notice>}
    </div>
  );
}
