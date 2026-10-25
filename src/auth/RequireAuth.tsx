import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router";
import { getMe, UnauthenticatedError } from "../api/auth";

const RequireAuth = () => {
  const { isPending, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const location = useLocation();

  if (isPending) {
    return <div>로딩 중...</div>;
  }

  if (error instanceof UnauthenticatedError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
