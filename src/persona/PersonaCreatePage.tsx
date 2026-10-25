import { useState, type SubmitEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { createPersona } from "../api/persona";

const PersonaCreatePage = () => {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createPersonaMutation = useMutation({
    mutationFn: createPersona,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["personas"] });
      navigate("/persona");
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPersonaMutation.mutate({ displayName, bio });
  };

  return (
    <main>
      <h1>프로필 만들기</h1>
      <form onSubmit={handleSubmit}>
        <label>
          이름
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </label>
        <label>
          소개
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={createPersonaMutation.isPending}>
          {createPersonaMutation.isPending ? "생성 중..." : "만들기"}
        </button>
        {createPersonaMutation.isError && <p>페르소나 생성에 실패했습니다.</p>}
      </form>
      <Link to="/persona">취소</Link>
    </main>
  );
};

export default PersonaCreatePage;
