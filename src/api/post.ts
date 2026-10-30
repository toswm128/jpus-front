import { prepareRichPost, type RichDocument, type RichPostDraft } from "../feed/richContent";

export interface Post {
  id: number;
  title: string | null;
  content: string;
  personaId: number;
  authorNameSnapshot: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface PostSummaryResponse extends Post {
  commentCount: number;
  reactionCount: number;
  reactedByMe: boolean;
}

export interface PostImageResponse {
  id: number;
  url: string;
  sortOrder: number;
}

export interface PostDetailResponse extends PostSummaryResponse {
  contentJson?: RichDocument | null;
  images?: PostImageResponse[];
}

export interface PageMetadata {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: PageMetadata;
}

export type PostPageResponse = PagedResponse<PostSummaryResponse>;

export interface ReactionResponse {
  reactionCount: number;
  reactedByMe: boolean;
}

export interface comment {
  id: number;
  postId: number;
  personaId: number;
  content: string;
  authorNameSnapshot: string;
  createdAt: string;
  updatedAt: string | null;
  isMine: boolean;
}

// Match the current comment column's capacity until its server policy changes.
export const MAX_COMMENT_LENGTH = 255;

export interface UpdateCommentRequest {
  postId: number;
  commentId: number;
  content: string;
}

function validateCommentContent(content: string): void {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("댓글 내용을 입력해 주세요.");
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    throw new Error(`댓글은 ${MAX_COMMENT_LENGTH}자 이내로 입력해 주세요.`);
  }
}

export interface createCommentRequest {
  id: number;
  content: string;
}
export interface CreatePostRequest {
  title: string;
  content: string;
}

export interface CreateRichPostRequest {
  title: string;
  draft: RichPostDraft;
}

export async function getPosts(
  page = 0,
  size = 20,
): Promise<PostPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const response = await fetch(`/api/posts?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("게시글 조회 실패");
  }

  return response.json();
}

export async function getPost(id: number): Promise<PostDetailResponse> {
  const response = await fetch("/api/posts/" + id, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("게시글 조회 실패");
  }

  return response.json();
}

export async function createRichPost({
  title,
  draft,
}: CreateRichPostRequest): Promise<Post> {
  const personaId = Number(localStorage.getItem("personaId"));
  if (!Number.isSafeInteger(personaId) || personaId <= 0) {
    throw new Error("프로필을 선택해 주세요.");
  }
  const trimmedTitle = title.trim();
  if (!trimmedTitle || trimmedTitle.length > 100) {
    throw new Error("제목은 1~100자로 입력해 주세요.");
  }

  const prepared = prepareRichPost(draft);
  const body = new FormData();
  body.append("post", new Blob([JSON.stringify({
    personaId,
    title: trimmedTitle,
    contentJson: prepared.contentJson,
    imageClientIds: prepared.imageClientIds,
  })], { type: "application/json" }));
  for (const image of prepared.images) {
    body.append("images", image, image.name);
  }

  const response = await fetch("/api/posts", {
    method: "POST",
    credentials: "include",
    body,
  });

  if (!response.ok) {
    const message = response.status === 413
      ? "첨부한 사진의 용량이 너무 커요. 장당 5MB 이하로 선택해 주세요."
      : "이야기를 게시하지 못했어요. 잠시 후 다시 시도해 주세요.";
    throw new Error(message);
  }

  return response.json();
}

export async function createPost({
  title,
  content,
}: CreatePostRequest): Promise<Post> {
  const personaId = Number(localStorage.getItem("personaId"));
  if (!Number.isSafeInteger(personaId) || personaId <= 0) {
    throw new Error("프로필 선택 필요");
  }

  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      personaId,
      title,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error("게시글 작성 실패");
  }

  return response.json();
}

export async function createComment({
  id,
  content,
}: createCommentRequest): Promise<comment> {
  validateCommentContent(content);
  const personaId = localStorage.getItem("personaId");

  if (!personaId) throw new Error("프로필 선택 필요");
  const response = await fetch("/api/posts/" + id + "/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      personaId,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error("댓글달기 실패");
  }

  return response.json();
}

export async function updateComment({
  postId,
  commentId,
  content,
}: UpdateCommentRequest): Promise<comment> {
  if (!Number.isSafeInteger(postId) || postId <= 0
      || !Number.isSafeInteger(commentId) || commentId <= 0) {
    throw new Error("수정할 댓글을 확인해 주세요.");
  }
  validateCommentContent(content);

  const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("댓글이 삭제되었거나 수정할 수 없어요.");
    }
    if (response.status === 401) {
      throw new Error("로그인이 만료됐어요. 다시 로그인해 주세요.");
    }
    throw new Error("댓글을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  return response.json();
}

export async function getComments(id: number): Promise<comment[]> {
  const response = await fetch("/api/posts/" + id + "/comments", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("댓글 찾기 실패");
  }

  return response.json();
}

export async function deleteComment({
  postId,
  commentId,
}: {
  postId: number;
  commentId: number;
}): Promise<void> {
  const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("댓글 삭제 실패");
  }
}

export async function getPostReaction(
  postId: number,
): Promise<ReactionResponse> {
  const response = await fetch(`/api/posts/${postId}/reaction`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("좋아요 조회 실패");
  }

  return response.json();
}

export async function likePost(postId: number): Promise<void> {
  const response = await fetch(`/api/posts/${postId}/reaction`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("좋아요 실패");
  }
}

export async function unlikePost(postId: number): Promise<void> {
  const response = await fetch(`/api/posts/${postId}/reaction`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("좋아요 취소 실패");
  }
}
