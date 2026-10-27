import { useState, type SubmitEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { createPersona } from "../api/persona";
import Icon from "../components/Icon";
import {
  Avatar,
  Button,
  Card,
  FormField,
  Notice,
  PageHeader,
} from "../components/ui";

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
    if (createPersonaMutation.isPending) return;
    createPersonaMutation.mutate({ displayName, bio });
  };

  return (
    <div className="page-stack">
      <Link to="/persona" className="back-link">
        <Icon name="arrow-left" size={16} />
        나의 페르소나
      </Link>

      <PageHeader
        eyebrow="A NEW SIDE OF YOU"
        title="페르소나 만들기"
        description="이곳에서 보여줄 나의 모습을 정해보세요. 글과 댓글에 이 이름이 표시돼요."
      />

      <div className="persona-editor">
        <Card className="persona-form">
          <form className="form-stack" onSubmit={handleSubmit}>
            <FormField
              label="페르소나 이름"
              htmlFor="persona-display-name"
              hint="다른 사람들에게 보여줄 이름이에요."
            >
              <input
                id="persona-display-name"
                aria-describedby="persona-display-name-hint"
                name="displayName"
                className="input"
                type="text"
                placeholder="어떤 이름으로 이야기할까요?"
                autoComplete="off"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={createPersonaMutation.isPending}
                required
              />
            </FormField>

            <FormField
              label="한 줄 소개"
              htmlFor="persona-bio"
              hint="관심사나 취향처럼, 이 페르소나를 표현하는 이야기를 적어주세요."
            >
              <textarea
                id="persona-bio"
                aria-describedby="persona-bio-hint"
                name="bio"
                className="textarea"
                rows={5}
                placeholder="나를 소개하는 짧은 이야기"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                disabled={createPersonaMutation.isPending}
                required
              />
            </FormField>

            {createPersonaMutation.isError && (
              <Notice tone="error">
                페르소나를 만들지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.
              </Notice>
            )}

            <div className="form-actions">
              <Link to="/persona" className="button button--ghost">
                취소
              </Link>
              <Button type="submit" disabled={createPersonaMutation.isPending}>
                <Icon name="plus" size={17} />
                {createPersonaMutation.isPending ? "만드는 중..." : "페르소나 만들기"}
              </Button>
            </div>
          </form>
        </Card>

        <aside className="persona-preview" aria-label="페르소나 미리보기">
          <p className="persona-preview-label">미리보기</p>
          <Card className="persona-preview-card">
            <Avatar name={displayName.trim() || "?"} size="lg" />
            <h2 className="persona-preview-name">
              {displayName || "페르소나 이름"}
            </h2>
            <p className="persona-preview-bio">
              {bio || "나를 소개하는 짧은 이야기가 이곳에 표시돼요."}
            </p>
            <div className="persona-preview-meta">
              <Icon name="person" size={14} />
              나의 공개 프로필
            </div>
          </Card>
          <p className="muted-text">
            만든 페르소나는 목록에서 선택한 뒤 바로 사용할 수 있어요.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default PersonaCreatePage;
