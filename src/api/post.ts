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

export interface createCommentRequest {
  id: number;
  content: string;
}
export interface CreatePostRequest {
  title: string;
  content: string;
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

export async function getPost(id: number): Promise<PostSummaryResponse> {
  const response = await fetch("/api/posts/" + id, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("게시글 조회 실패");
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
}: createCommentRequest): Promise<void> {
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
