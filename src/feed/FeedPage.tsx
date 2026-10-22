import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getMe } from "../api/auth";

const FeedPage = () => {
  const {
    data: me,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  if (isLoading) return <div>로딩 중...</div>;

  if (isError)
    return (
      <div>
        로그인이 필요합니다. <Link to="/login">로그인 </Link>
      </div>
    );
  return (
    <>
      <div className="">환영합니다. {me?.nickname}님</div>
    </>
  );
};

export default FeedPage;
