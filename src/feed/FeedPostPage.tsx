import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { getPersonas } from "../api/persona";
import { createRichPost } from "../api/post";
import { postKeys } from "../api/postKeys";
import Icon from "../components/Icon";
import { Avatar, Button, Card, LoadingState, Notice, PageHeader } from "../components/ui";
import type { RichPostDraft } from "./richContent";

const RichPostEditor = lazy(() => import("./RichPostEditor"));

const FeedPostPage = () => {
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState<RichPostDraft | null>(null);
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { data: personas } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
  });
  const selectedPersona = personas?.find(
    (persona) => persona.id === Number(localStorage.getItem("personaId")),
  );

  const createPostMutation = useMutation({
    mutationFn: createRichPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      nav("/");
    },
  });

  const textLength = draft?.text.length ?? 0;
  const canPublish = title.trim().length > 0
    && draft !== null
    && (draft.text.trim().length > 0 || draft.images.length > 0)
    && textLength <= 20_000
    && !createPostMutation.isPending;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish || !draft) return;
    createPostMutation.mutate({ title: title.trim(), draft });
  };

  return (
    <div className="page-stack">
      <Link className="back-link" to="/">
        <Icon name="arrow-left" size={17} />
        피드로 돌아가기
      </Link>
      <PageHeader
        eyebrow="NEW STORY"
        title="당신의 이야기를 들려주세요"
        description="떠오른 생각부터 가벼운 일상까지, 편하게 나눠보세요."
      />

      <Card className="editor-card">
        <form onSubmit={handleSubmit}>
          <div className="editor-heading">
            <div className="editor-identity">
              <Avatar name={selectedPersona?.displayName ?? "나"} />
              <div className="author__meta">
                <span className="author__name">{selectedPersona?.displayName ?? "나의 페르소나"}</span>
                <span className="author__time">이 페르소나의 이름으로 게시돼요</span>
              </div>
            </div>
            <Link className="button button--ghost button--sm" to="/persona">변경</Link>
          </div>

          <div className="editor-title-field">
            <label className="editor-title-label" htmlFor="post-title">제목</label>
            <input
              id="post-title"
              name="title"
              className="input editor-title-input"
              type="text"
              placeholder="이야기의 제목을 적어주세요"
              autoComplete="off"
              aria-describedby="post-title-hint"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={createPostMutation.isPending}
              maxLength={100}
              required
            />
            <div className="editor-title-meta">
              <span id="post-title-hint">100자 이내로 입력해 주세요.</span>
              <span>{title.length} / 100</span>
            </div>
          </div>

          <Suspense fallback={<LoadingState label="글쓰기 도구를 준비하고 있어요." />}>
            <RichPostEditor
              onChange={setDraft}
              disabled={createPostMutation.isPending}
            />
          </Suspense>

          {textLength > 20_000 && (
            <Notice>본문은 20,000자 이내로 작성해 주세요.</Notice>
          )}

          {createPostMutation.isError && (
            <Notice>{createPostMutation.error.message} 작성한 제목과 내용은 유지돼요.</Notice>
          )}

          <div className="editor-footer">
            <span className="editor-count">
              {textLength.toLocaleString("ko-KR")} / 20,000자
              {(draft?.images.length ?? 0) > 0 && ` · 사진 ${draft?.images.length}장`}
            </span>
            <div className="form-actions">
              <Link className="button button--ghost" to="/">취소</Link>
              <Button
                type="submit"
                disabled={!canPublish}
              >
                <Icon name="arrow-up-right" size={18} />
                {createPostMutation.isPending ? "게시 중..." : "이야기 게시하기"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FeedPostPage;
