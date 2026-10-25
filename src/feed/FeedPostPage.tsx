import { useMutation } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";
import { createPost } from "../api/post";
import { useNavigate } from "react-router";

const FeedPostPage = () => {
  const [text, setText] = useState("");
  const nav = useNavigate();

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      nav("/");
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    createPostMutation.mutate({ content: text });
  };

  return (
    <>
      <div className="">
        <h1>게시글 작성</h1>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button type="submit"> 게시</button>
        </form>
      </div>
    </>
  );
};

export default FeedPostPage;
