import { Fragment, type ReactNode } from "react";
import { parseRichDocument, type RichDocument } from "./richContent";
import "./PostContent.css";

interface PostContentProps {
  postId: number;
  content: string;
  contentJson?: RichDocument | string | null;
  images?: { id: number; url: string; sortOrder: number }[];
}

function hasVisibleContent(node: RichDocument): boolean {
  if (node.type === "image" || node.type === "horizontalRule") return true;
  if (node.type === "text" && node.text?.trim()) return true;
  return node.content?.some(hasVisibleContent) ?? false;
}

function renderText(node: RichDocument, key: string): ReactNode {
  let result: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold": result = <strong>{result}</strong>; break;
      case "italic": result = <em>{result}</em>; break;
      case "strike": result = <s>{result}</s>; break;
      case "underline": result = <u>{result}</u>; break;
      case "code": result = <code>{result}</code>; break;
    }
  }
  return <Fragment key={key}>{result}</Fragment>;
}

export default function PostContent({
  postId,
  content,
  contentJson,
  images = [],
}: PostContentProps) {
  const document = parseRichDocument(contentJson);
  if (!document || !hasVisibleContent(document)) {
    return (
      <div className="post-detail__body rich-content rich-content--plain">
        {typeof content === "string" ? content : ""}
      </div>
    );
  }

  const safeImageUrls = new Map<number, string>();
  if (Number.isSafeInteger(postId) && postId > 0 && Array.isArray(images)) {
    for (const image of images) {
      if (!image || !Number.isSafeInteger(image.id) || image.id <= 0) continue;
      const expected = `/posts/${postId}/images/${image.id}`;
      if (image.url === expected) safeImageUrls.set(image.id, "/api" + expected);
    }
  }

  const renderNode = (node: RichDocument, key: string): ReactNode => {
    const children = node.content?.map((child, index) => renderNode(child, key + "." + index)) ?? [];
    switch (node.type) {
      case "text": return renderText(node, key);
      case "paragraph": return <p key={key}>{children.length > 0 ? children : <br />}</p>;
      case "heading":
        return node.attrs?.level === 3
          ? <h3 key={key}>{children}</h3>
          : <h2 key={key}>{children}</h2>;
      case "bulletList": return <ul key={key}>{children}</ul>;
      case "orderedList": return <ol key={key} start={node.attrs?.start}>{children}</ol>;
      case "listItem": return <li key={key}>{children}</li>;
      case "blockquote": return <blockquote key={key}>{children}</blockquote>;
      case "codeBlock":
        return (
          <pre key={key}>
            <code>{node.content?.map((child) => child.text ?? "").join("")}</code>
          </pre>
        );
      case "hardBreak": return <br key={key} />;
      case "horizontalRule": return <hr key={key} />;
      case "image": {
        const imageId = node.attrs?.imageId;
        const url = typeof imageId === "number" ? safeImageUrls.get(imageId) : undefined;
        const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "게시글 첨부 이미지";
        if (!url) {
          return (
            <span
              key={key}
              className="rich-content__image-placeholder"
              role="img"
              aria-label={alt || "이미지를 표시할 수 없어요"}
            >
              이미지를 표시할 수 없어요.
            </span>
          );
        }
        return (
          <img
            key={key}
            className="rich-content__image"
            src={url}
            alt={alt}
            title={typeof node.attrs?.title === "string" ? node.attrs.title : undefined}
            loading="lazy"
            decoding="async"
          />
        );
      }
      default: return null;
    }
  };

  return (
    <div className="post-detail__body rich-content">
      {document.content?.map((node, index) => renderNode(node, String(index)))}
    </div>
  );
}
