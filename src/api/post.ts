export interface Post {
  id: number;
  content: string;
  personaId: number;
  authorNameSnapshot: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface comment {
  id: number;
  postId: number;
  personaId: number;
  content: string;
  authorNameSnapshot: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface createCommentRequest {
  id: number;
  content: string;
  personaId: number;
}

export async function getPosts(): Promise<Post[]> {
  const response = await fetch("/api/posts", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("게시글 조회 실패");
  }

  return response.json();
}

export async function getPost(id: number): Promise<Post> {
  const response = await fetch("/api/posts/" + id, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("게시글 조회 실패");
  }

  return response.json();
}

export async function createComment({
  id,
  personaId,
  content,
}: createCommentRequest): Promise<void> {
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
