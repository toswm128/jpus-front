import { useQuery } from "@tanstack/react-query";
import { getPost } from "../api/post";
import { useParams } from "react-router";
import CommentComponent from "./CommentComponent";

const FeedDetailPage = () => {
  const { id } = useParams();

  const postId = Number(id);

  const {
    isLoading,
    isError,
    data: post,
  } = useQuery({
    queryKey: ["posts", id],
    queryFn: () => getPost(postId),
  });

  if (isLoading) return <div>로딩 중...</div>;

  if (isError) return <div>문제가 생겼습니다.</div>;

  return (
    <div
      className="
        "
    >
      <h1>{post?.content}</h1>
      <div>{post?.authorNameSnapshot}</div>

      <CommentComponent postId={postId} />
    </div>
  );
};

export default FeedDetailPage;
