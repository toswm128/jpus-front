import { useQuery } from "@tanstack/react-query";
import { getPersonas } from "../api/persona";
import { useNavigate } from "react-router";

const PersonaPage = () => {
  const { isLoading, data } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
  });

  const nav = useNavigate();

  if (isLoading) {
    return <>로딩중</>;
  }

  const handleClick = (personaId: number): void => {
    localStorage.setItem("personaId", personaId.toString());
    nav("/");
  };

  return (
    <>
      <div className="">
        <h1>당신의 프로필을 정하세요</h1>
        <div className="persona-list">
          {data?.map((persona, key) => (
            <div
              key={key}
              onClick={() => handleClick(persona.id)}
              style={{
                cursor: "pointer",
                borderBottom: "1px solid black",
                padding: "16px 8px",
              }}
            >
              <div className="">{persona.displayName}</div>
              <div className="">{persona.bio}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PersonaPage;
