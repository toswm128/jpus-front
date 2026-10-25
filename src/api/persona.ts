export interface Persona {
  id: number;
  displayName: string;
  bio: string;
  profileImageKey: string;
}

export interface CreatePersonaRequest {
  displayName: string;
  bio: string;
}

export async function createPersona(
  request: CreatePersonaRequest,
): Promise<void> {
  const response = await fetch("/api/persona", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("프로필 생성 실패");
  }
}

export async function getPersonas(): Promise<Persona[]> {
  const response = await fetch("/api/persona", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("프로필 조회 실패");
  }

  return response.json();
}
