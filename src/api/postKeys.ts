export const postKeys = {
  all: ["posts"] as const,
  list: (userId: number | undefined, page: number, size: number) =>
    ["posts", "list", userId, page, size] as const,
  detail: (userId: number | undefined, postId: number) =>
    ["posts", "detail", userId, postId] as const,
};

export const commentKeys = {
  all: ["comments"] as const,
  list: (userId: number | undefined, postId: number) =>
    ["comments", userId, postId] as const,
};
