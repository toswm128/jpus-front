import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router";
import { getPersonas } from "../api/persona";

const RequirePersona = () => {
  const {
    isPending,
    error,
    data: personas,
  } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
    retry: false,
  });

  const seletedPersonaId = localStorage.getItem("personaId");

  const location = useLocation();

  if (isPending) {
    return <div>로딩 중...</div>;
  }
  if (error) {
    return <div>문제가 발생했습니다.</div>;
  }
  if (personas?.length === 0) {
    return <Navigate to="/persona/create" state={{ from: location }} replace />;
  }

  if (
    !seletedPersonaId ||
    !personas?.some((p) => p.id === Number(seletedPersonaId))
  ) {
    return <Navigate to="/persona" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequirePersona;
