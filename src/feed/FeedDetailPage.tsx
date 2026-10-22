import { useQuery } from "@tanstack/react-query";
import { getPosts } from "../api/post";
import { useNavigate, useParams } from "react-router";

const FeedDetailPage = () => {
  const {
    isLoading,
    isError,
    data: posts,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  const { id } = useParams();

  const postId = Number(id);

  const post = posts?.find((post) => post.id == postId);

  if (isLoading) return <div>로딩 중...</div>;

  if (isError) return <div>문제가 생겼습니다.</div>;

  return (
    <div
      className="
        "
    >
      <h1>{post?.content}</h1>
      <div>{post?.authorNameSnapshot}</div>

      <form>
        <h5>댓글</h5>
        <textarea />
        <button type="submit">작성</button>
      </form>
    </div>
  );
};

export default FeedDetailPage;
