import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, deleteComment, getComments } from "../api/post";
import { useState, type SubmitEvent } from "react";

interface CommentComponentI {
  postId: number;
}

const CommentComponent = ({ postId }: CommentComponentI) => {
  const [text, setText] = useState("");
  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["posts", postId, "comments"],
      });
    },
    onError: () => {
      alert("댓글 삭제에 실패했습니다.");
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    createCommentMutation.mutate({
      id: postId,
      content: text,
    });
  };

  const handleDelete = (commentId: number) => {
    deleteCommentMutation.mutate({ postId, commentId });
  };

  const { isLoading, data: comments } = useQuery({
    queryKey: ["posts", postId, "comments"],
    queryFn: () => getComments(postId),
  });

  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: createComment,

    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["posts", postId, "comments"],
      });
      setText("");
    },

    onError: () => {
      alert("댓글 작성에 실패했습니다.");
    },
  });

  if (isLoading) {
    return <>로딩중</>;
  }

  return (
    <>
      <div
        className=""
        style={{
          margin: "32px auto",
        }}
      >
        {comments?.map((comment, key) => (
          <div
            style={{
              border: "1px solid black",
              padding: "16px 4px",
              display: "flex",
              gap: "4px",
            }}
            key={key}
          >
            <div className="">{comment.authorNameSnapshot}:</div>
            <div className="">{comment.content}</div>
            {comment.isMine && (
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={deleteCommentMutation.isPending}
              >
                {deleteCommentMutation.isPending ? "삭제 중..." : "삭제"}
              </button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <h5>댓글</h5>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={createCommentMutation.isPending}>
          {createCommentMutation.isPending ? "게시 중..." : "게시"}
        </button>
      </form>
    </>
  );
};

export default CommentComponent;
