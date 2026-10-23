import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComment, getComments } from "../api/post";
import { useState, type SubmitEvent } from "react";

interface CommentComponentI {
  postId: number;
}

const CommentComponent = ({ postId }: CommentComponentI) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    createCommentMutation.mutate({
      id: postId,
      content: text,
    });
    setText("");
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
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <h5>댓글</h5>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">작성</button>
      </form>
    </>
  );
};

export default CommentComponent;
