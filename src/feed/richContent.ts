import type { JSONContent } from "@tiptap/core";

export type RichDocument = JSONContent;

export interface PostImageAttachment {
  clientId: string;
  file: File;
}

export interface RichPostDraft {
  contentJson: RichDocument;
  text: string;
  images: PostImageAttachment[];
}

export const MAX_POST_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_TEXT_LENGTH = 20_000;
export const MAX_RICH_DOCUMENT_BYTES = 256 * 1024;
export const MAX_RICH_DOCUMENT_DEPTH = 32;
export const MAX_RICH_DOCUMENT_NODES = 10_000;
export const POST_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;

const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const BLOCK_TYPES = new Set([
  "paragraph", "heading", "bulletList", "orderedList", "blockquote",
  "codeBlock", "horizontalRule", "image",
]);
const INLINE_TYPES = new Set(["text", "hardBreak", "image"]);
const MARK_TYPES = new Set(["bold", "italic", "strike", "underline", "code"]);
const NODE_TYPES = new Set([
  "doc", ...BLOCK_TYPES, "text", "hardBreak", "listItem",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidDocument(): never {
  throw new Error("본문 형식을 확인하지 못했어요. 내용을 다시 확인해 주세요.");
}

function readJson(source: unknown): unknown {
  let serialized: string;
  try {
    const result = typeof source === "string" ? source : JSON.stringify(source);
    if (typeof result !== "string") return invalidDocument();
    serialized = result;
  } catch {
    return invalidDocument();
  }

  if (
    serialized.length > MAX_RICH_DOCUMENT_BYTES ||
    new TextEncoder().encode(serialized).byteLength > MAX_RICH_DOCUMENT_BYTES
  ) {
    throw new Error("본문 용량이 너무 커요. 내용을 조금 줄여 주세요.");
  }

  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    return invalidDocument();
  }
}

function allowsChild(parent: string, child: string): boolean {
  if (parent === "doc" || parent === "blockquote" || parent === "listItem") {
    return BLOCK_TYPES.has(child);
  }
  if (parent === "paragraph" || parent === "heading") return INLINE_TYPES.has(child);
  if (parent === "bulletList" || parent === "orderedList") return child === "listItem";
  if (parent === "codeBlock") return child === "text";
  return false;
}

function sanitizeDocument(source: unknown, mode: "draft" | "stored") {
  const sourceDocument = readJson(source);
  if (!isRecord(sourceDocument) || sourceDocument.type !== "doc") invalidDocument();

  let nodeCount = 0;
  let textLength = 0;
  let hasText = false;
  let imageCount = 0;
  const clientIds: string[] = [];
  const seenClientIds = new Set<string>();

  const visit = (sourceNode: unknown, depth: number): RichDocument => {
    if (
      depth > MAX_RICH_DOCUMENT_DEPTH ||
      ++nodeCount > MAX_RICH_DOCUMENT_NODES ||
      !isRecord(sourceNode) ||
      typeof sourceNode.type !== "string" ||
      !NODE_TYPES.has(sourceNode.type)
    ) invalidDocument();

    const type = sourceNode.type as string;
    const result: RichDocument = { type };
    const attrs = sourceNode.attrs === undefined ? {} : sourceNode.attrs;
    if (!isRecord(attrs)) invalidDocument();

    if (type === "text") {
      if (typeof sourceNode.text !== "string") invalidDocument();
      result.text = sourceNode.text as string;
      textLength += result.text.length;
      if (textLength > MAX_POST_TEXT_LENGTH) {
        throw new Error("본문은 20,000자 이내로 작성해 주세요.");
      }
      hasText ||= result.text.trim().length > 0;
    }

    if (sourceNode.marks !== undefined) {
      if (!Array.isArray(sourceNode.marks) || sourceNode.marks.length > MARK_TYPES.size) {
        invalidDocument();
      }
      const seenMarks = new Set<string>();
      const marks = (sourceNode.marks as unknown[]).map((mark) => {
        if (
          !isRecord(mark) || typeof mark.type !== "string" ||
          !MARK_TYPES.has(mark.type) || seenMarks.has(mark.type)
        ) invalidDocument();
        const markType = mark.type as string;
        seenMarks.add(markType);
        return { type: markType };
      });
      if (type === "text" && marks.length > 0) result.marks = marks;
    }

    if (type === "heading") {
      if (attrs.level !== 2 && attrs.level !== 3) invalidDocument();
      result.attrs = { level: attrs.level };
    } else if (type === "orderedList") {
      const start = attrs.start === undefined ? 1 : attrs.start;
      if (typeof start !== "number" || !Number.isSafeInteger(start) || start < 1 || start > 2_147_483_647) {
        invalidDocument();
      }
      result.attrs = { start };
    } else if (type === "image") {
      if (++imageCount > MAX_POST_IMAGES) {
        throw new Error("이미지는 최대 5장까지 첨부할 수 있어요.");
      }
      const imageAttrs: Record<string, string | number> = {};
      for (const key of ["alt", "title"] as const) {
        if (attrs[key] !== undefined && attrs[key] !== null) {
          if (typeof attrs[key] !== "string") invalidDocument();
          imageAttrs[key] = attrs[key] as string;
        }
      }
      if (mode === "draft") {
        const clientId = attrs.clientId;
        if (attrs.imageId !== undefined && attrs.imageId !== null) {
          throw new Error("이미지를 다시 첨부해 주세요.");
        }
        if (typeof clientId !== "string" || !CLIENT_ID_PATTERN.test(clientId)) {
          throw new Error("첨부 이미지 정보를 확인하지 못했어요. 이미지를 다시 추가해 주세요.");
        }
        if (seenClientIds.has(clientId)) {
          throw new Error("같은 이미지가 본문에 중복되어 있어요. 다시 첨부해 주세요.");
        }
        seenClientIds.add(clientId);
        clientIds.push(clientId);
        imageAttrs.clientId = clientId;
      } else if (
        typeof attrs.imageId === "number" &&
        Number.isSafeInteger(attrs.imageId) && attrs.imageId > 0
      ) {
        imageAttrs.imageId = attrs.imageId;
      }
      // Browser preview URLs and all other attributes never enter the stored document.
      result.attrs = imageAttrs;
    }

    if (sourceNode.content !== undefined) {
      if (
        !Array.isArray(sourceNode.content) ||
        sourceNode.content.length > MAX_RICH_DOCUMENT_NODES
      ) invalidDocument();
      result.content = (sourceNode.content as unknown[]).map((child) => {
        if (!isRecord(child) || typeof child.type !== "string" || !allowsChild(type, child.type)) {
          invalidDocument();
        }
        return visit(child, depth + 1);
      });
    }

    return result;
  };

  return { document: visit(sourceDocument, 1), clientIds, hasText };
}

/** Reads only the supported JSON vocabulary; malformed content uses the plain body instead. */
export function parseRichDocument(source: unknown): RichDocument | null {
  if (source === null || source === undefined) return null;
  try {
    return sanitizeDocument(source, "stored").document;
  } catch {
    return null;
  }
}

/** Matches upload files to image positions without mutating the editor's preview document. */
export function prepareRichPost(draft: RichPostDraft): {
  contentJson: RichDocument;
  imageClientIds: string[];
  images: File[];
} {
  if (!isRecord(draft) || typeof draft.text !== "string" || !Array.isArray(draft.images)) {
    invalidDocument();
  }
  if (draft.text.length > MAX_POST_TEXT_LENGTH) {
    throw new Error("본문은 20,000자 이내로 작성해 주세요.");
  }
  if (draft.images.length > MAX_POST_IMAGES) {
    throw new Error("이미지는 최대 5장까지 첨부할 수 있어요.");
  }

  const { document, clientIds, hasText } = sanitizeDocument(draft.contentJson, "draft");
  const filesByClientId = new Map<string, File>();

  for (const attachment of draft.images) {
    if (
      !isRecord(attachment) || typeof attachment.clientId !== "string" ||
      !CLIENT_ID_PATTERN.test(attachment.clientId) ||
      typeof File === "undefined" || !(attachment.file instanceof File)
    ) {
      throw new Error("첨부 이미지 정보를 확인하지 못했어요. 이미지를 다시 추가해 주세요.");
    }
    if (filesByClientId.has(attachment.clientId)) {
      throw new Error("첨부 이미지 정보가 중복되어 있어요. 이미지를 다시 추가해 주세요.");
    }
    if (attachment.file.size <= 0 || attachment.file.size > MAX_IMAGE_BYTES) {
      throw new Error("이미지는 한 장당 5MB 이하의 비어 있지 않은 파일이어야 해요.");
    }
    if (!(POST_IMAGE_MIME_TYPES as readonly string[]).includes(attachment.file.type)) {
      throw new Error("JPEG 또는 PNG 이미지만 첨부할 수 있어요.");
    }
    filesByClientId.set(attachment.clientId, attachment.file);
  }

  if (
    clientIds.length !== filesByClientId.size ||
    clientIds.some((clientId) => !filesByClientId.has(clientId))
  ) {
    throw new Error("본문의 이미지와 첨부 파일이 일치하지 않아요. 이미지를 다시 추가해 주세요.");
  }
  if ((!hasText || !draft.text.trim()) && clientIds.length === 0) {
    throw new Error("이야기 내용이나 이미지를 추가해 주세요.");
  }

  return {
    contentJson: document,
    imageClientIds: clientIds,
    images: clientIds.map((clientId) => filesByClientId.get(clientId)!),
  };
}
