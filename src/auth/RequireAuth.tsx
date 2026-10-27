import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router";
import { getMe, UnauthenticatedError } from "../api/auth";
import { LoadingState, Notice } from "../components/ui";

const RequireAuth = () => {
  const { isPending, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const location = useLocation();

  if (isPending) {
    return <div className="route-state"><LoadingState label="로그인 정보를 확인하고 있어요" /></div>;
  }

  if (error instanceof UnauthenticatedError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (error) {
    return <div className="route-state"><Notice>로그인 정보를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</Notice></div>;
  }

  return <Outlet />;
};

export default RequireAuth;
