import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { getPersonas } from "../api/persona";
import { createPost } from "../api/post";
import { postKeys } from "../api/postKeys";
import Icon from "../components/Icon";
import { Avatar, Button, Card, Notice, PageHeader } from "../components/ui";

const FeedPostPage = () => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
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
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      nav("/");
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !text.trim() || createPostMutation.isPending) return;
    createPostMutation.mutate({ title: title.trim(), content: text });
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

          <label className="sr-only" htmlFor="post-content">이야기 내용</label>
          <textarea
            id="post-content"
            name="content"
            className="textarea editor-textarea"
            placeholder="지금 나누고 싶은 이야기는 무엇인가요?"
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={createPostMutation.isPending}
            required
            rows={10}
          />

          {createPostMutation.isError && (
            <Notice>이야기를 게시하지 못했어요. 작성한 제목과 내용은 유지되니 다시 시도해 주세요.</Notice>
          )}

          <div className="editor-footer">
            <span className="editor-count">{text.length.toLocaleString("ko-KR")}자</span>
            <div className="form-actions">
              <Link className="button button--ghost" to="/">취소</Link>
              <Button
                type="submit"
                disabled={!title.trim() || !text.trim() || createPostMutation.isPending}
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
