export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest extends LoginRequest {
  nickname: string;
}

export interface UserResponse {
  id: number;
  username: string;
  nickname: string;
}

export async function login(request: LoginRequest): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("로그인 실패");
  }
}

export async function signup(request: SignupRequest): Promise<void> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("회원가입 실패");
  }
}

export async function getMe(): Promise<UserResponse> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("사용자 조회 실패");
  }

  return response.json();
}
