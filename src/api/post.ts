export interface Post {
  id: number;
  content: string;
  personaId: number;
  authorNameSnapshot: string;
  createdAt: string;
  updatedAt: string | null;
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
