import { useState, type SubmitEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import { signup } from "../api/auth";
import AuthLayout from "../components/AuthLayout";
import { Button, FormField, Notice } from "../components/ui";

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
    <AuthLayout
      eyebrow="JOIN THE CONVERSATION"
      title="새로운 이야기를 시작해요"
      description="계정을 만들고, 나를 표현할 페르소나로 JPUS에 참여하세요."
      footer={
        <p>
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      }
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <FormField label="아이디" htmlFor="signup-username">
          <input
            id="signup-username"
            className="input"
            type="text"
            placeholder="로그인에 사용할 아이디"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={signupMutation.isPending}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </FormField>
        <FormField label="비밀번호" htmlFor="signup-password">
          <input
            id="signup-password"
            className="input"
            type="password"
            placeholder="비밀번호를 입력하세요"
            autoComplete="new-password"
            required
            disabled={signupMutation.isPending}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <FormField
          label="계정 닉네임"
          htmlFor="signup-nickname"
          hint="계정을 구분하는 이름이에요. 글과 댓글에는 별도로 만든 페르소나 이름이 표시돼요."
        >
          <input
            id="signup-nickname"
            aria-describedby="signup-nickname-hint"
            className="input"
            type="text"
            placeholder="계정에서 사용할 이름"
            autoComplete="nickname"
            required
            disabled={signupMutation.isPending}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </FormField>
        {signupMutation.isError && (
          <Notice tone="error">
            가입을 완료하지 못했어요. 입력한 정보를 확인하고 다시 시도해 주세요.
          </Notice>
        )}
        {signupMutation.isSuccess && (
          <Notice tone="success">
            가입이 완료됐어요. <Link to="/login">로그인하고 첫 페르소나 만들기</Link>
          </Notice>
        )}
        <Button
          type="submit"
          fullWidth
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "계정 만드는 중..." : "계정 만들기"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
