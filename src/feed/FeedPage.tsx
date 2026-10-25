import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMe } from "../api/auth";
import { getPosts } from "../api/post";

const FeedPage = () => {
  const meData = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const postsQuery = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
    enabled: meData.isSuccess,
  });

  return (
    <>
      <div
        className="header"
        style={{
          padding: "16px",
          marginBottom: "16px",
          backgroundColor: "#cccccc",
          fontSize: "12px",
          textAlign: "right",
        }}
      >
        {meData.isSuccess ? (
          <>
            <Link to="/persona">프로필 설정 </Link>
            환영합니다. {meData.data.nickname}님
          </>
        ) : (
          <Link to="/login">로그인</Link>
        )}
      </div>
      {meData.isPending || (meData.isSuccess && postsQuery.isPending) ? (
        <div>로딩 중...</div>
      ) : meData.isError ? (
        <div>로그인이 필요합니다.</div>
      ) : (
        <>
          <div
            className="feed-wrapper"
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
            }}
          >
            {postsQuery.data?.map((post, key) => (
              <Link
                to={`/posts/${post.id}`}
                className="feed-item"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderBottom: "1px solid #a1a1a1",
                  cursor: "pointer",
                  display: "flex",
                }}
                key={key}
              >
                <div className="feed-item-index" style={{ width: "20px" }}>
                  {key + 1}.
                </div>
                <div className="feed-item-content" style={{ flex: "1" }}>
                  {post.content}
                </div>
                <div
                  className="feed-item-writer"
                  style={{ flexBasis: "100px", textAlign: "center" }}
                >
                  {post.authorNameSnapshot}
                </div>
              </Link>
            ))}
          </div>

          <div>
            <Link to="posts">글 쓰기</Link>
          </div>
        </>
      )}
    </>
  );
};

export default FeedPage;
