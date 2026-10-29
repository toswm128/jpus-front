import { useState, type SubmitEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { login } from "../api/auth";
import AuthLayout from "../components/AuthLayout";
import { Button, FormField, Notice } from "../components/ui";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: login,

    onSuccess: () => {
      for (const key of ["me", "personas", "posts", "comments", "reactions"]) {
        queryClient.removeQueries({ queryKey: [key] });
      }
      navigate("/");
    },
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="JPUS에 로그인"
      description="나의 페르소나로 이야기를 나누고, 새로운 대화를 이어가세요."
      footer={
        <p>
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <FormField label="아이디" htmlFor="login-username">
          <input
            id="login-username"
            className="input"
            type="text"
            placeholder="아이디를 입력하세요"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={loginMutation.isPending}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormField>
        <FormField label="비밀번호" htmlFor="login-password">
          <input
            id="login-password"
            className="input"
            type="password"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            required
            disabled={loginMutation.isPending}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {loginMutation.isError && (
          <Notice tone="error">
            로그인하지 못했어요. 아이디와 비밀번호를 확인한 뒤 다시 시도해 주세요.
          </Notice>
        )}
        <Button
          type="submit"
          fullWidth
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
