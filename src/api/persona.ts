export interface Persona {
  id: number;
  displayName: string;
  bio: string;
  profileImageKey: string;
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
