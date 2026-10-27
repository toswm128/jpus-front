import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router";
import { getPersonas } from "../api/persona";
import { LoadingState, Notice } from "../components/ui";

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

  const selectedPersonaId = localStorage.getItem("personaId");

  const location = useLocation();

  if (isPending) {
    return <LoadingState label="페르소나를 확인하고 있어요" />;
  }
  if (error) {
    return <Notice>페르소나를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</Notice>;
  }
  if (personas?.length === 0) {
    return <Navigate to="/persona/create" state={{ from: location }} replace />;
  }

  if (
    !selectedPersonaId ||
    !personas?.some((p) => p.id === Number(selectedPersonaId))
  ) {
    return <Navigate to="/persona" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequirePersona;
