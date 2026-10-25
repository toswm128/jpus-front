import { useState, type SubmitEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { login } from "../api/auth";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: login,

    onSuccess: async () => {
      navigate("/");
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div
      className="login-form-wrapper"
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        className="login-form"
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          width: "360px",
          minHeight: "300px",
          flexDirection: "column",
          alignItems: "center",
          border: "1px solid black",
          padding: "16px",
          borderRadius: "3%",
          gap: "8px",
        }}
      >
        <h2>로그인</h2>
        <input
          type="text"
          placeholder="아이디"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
          }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
          }}
        />
        <button
          type="submit"
          disabled={loginMutation.isPending}
          style={{
            width: "100%",
            padding: "16px",
            cursor: "pointer",
          }}
        >
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </button>
        {loginMutation.isError && <div>로그인 실패</div>}
        <Link to="/signup">회원가입</Link>
      </form>
    </div>
  );
};

export default LoginPage;
