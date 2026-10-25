import { useState, type SubmitEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import { signup } from "../api/auth";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const signupMutation = useMutation({
    mutationFn: signup,
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    signupMutation.mutate({ username, password, nickname });
  };

  return (
    <div
      className="login-form-wrapper"
      style={{
        width: "100%",
        minHeight: "100vh",
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
        <h2>회원가입</h2>
        <input
          type="text"
          placeholder="아이디"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          style={{ width: "100%", padding: "16px" }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{ width: "100%", padding: "16px" }}
        />
        <input
          type="text"
          placeholder="닉네임"
          autoComplete="nickname"
          required
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          style={{ width: "100%", padding: "16px" }}
        />
        <button
          type="submit"
          disabled={signupMutation.isPending}
          style={{ width: "100%", padding: "16px", cursor: "pointer" }}
        >
          {signupMutation.isPending ? "가입 중..." : "회원가입"}
        </button>
        {signupMutation.isError && <div>회원가입 실패</div>}
        {signupMutation.isSuccess && (
          <div>회원가입이 완료되었습니다. 로그인해 주세요.</div>
        )}
        <Link to="/login">로그인으로 돌아가기</Link>
      </form>
    </div>
  );
};

export default SignupPage;
