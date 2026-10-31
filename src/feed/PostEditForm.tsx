import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useRef, useState, type SubmitEvent } from "react";
import { getPost, updateRichPost, type PostDetailResponse } from "../api/post";
import { postKeys } from "../api/postKeys";
import { Button, LoadingState, Notice } from "../components/ui";
import {
  createPostEditDraft,
  MAX_POST_TEXT_LENGTH,
  prepareRichPostUpdate,
  type RichPostDraft,
} from "./richContent";
import "./PostEditForm.css";

const RichPostEditor = lazy(() => import("./RichPostEditor"));

type PostEditFormProps = {
  post: PostDetailResponse;
  userId: number;
  onCancel: () => void;
  onSaved: () => void;
};

type InitialDraft = {
  draft: RichPostDraft | null;
  existingImageIds: readonly number[];
  signature: string | null;
  error: string | null;
};

type SavePhase = "editing" | "saving" | "refreshing" | "saved-unconfirmed";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function PostEditForm({ post, userId, onCancel, onSaved }: PostEditFormProps) {
  const queryClient = useQueryClient();
  const [initial] = useState<InitialDraft>(() => {
    try {
      const existingImageIds = (post.images ?? []).map((image) => image.id);
      const draft = createPostEditDraft(post);
      let signature: string | null = null;
      try {
        signature = JSON.stringify(prepareRichPostUpdate(draft, existingImageIds).contentJson);
      } catch {
        // Legacy blank/over-limit bodies can still be opened and corrected.
      }
      return {
        draft,
        existingImageIds,
        signature,
        error: null,
      };
    } catch (error) {
      return {
        draft: null,
        existingImageIds: [],
        signature: null,
        error: errorMessage(error, "이 글의 본문을 수정 도구로 열지 못했어요."),
      };
    }
  });
  const [title, setTitle] = useState(post.title ?? "");
  const [draft, setDraft] = useState<RichPostDraft | null>(null);
  const [phase, setPhase] = useState<SavePhase>("editing");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const saveStarted = useRef(false);
  const refreshStarted = useRef(false);
  const saveMutation = useMutation({ mutationFn: updateRichPost });

  const validation = useMemo(() => {
    if (!draft || !initial.draft) return { signature: null, error: null };
    try {
      const prepared = prepareRichPostUpdate(draft, initial.existingImageIds);
      return { signature: JSON.stringify(prepared.contentJson), error: null };
    } catch (error) {
      return {
        signature: null,
        error: errorMessage(error, "수정할 본문을 다시 확인해 주세요."),
      };
    }
  }, [draft, initial]);

  const isLocked = phase !== "editing";
  const hasChanges = title.trim() !== (post.title ?? "").trim()
    || (validation.signature !== null && validation.signature !== initial.signature);
  const canSave = draft !== null
    && initial.error === null
    && title.trim().length > 0
    && title.length <= 100
    && validation.signature !== null
    && validation.error === null
    && hasChanges
    && !isLocked;

  const refreshSavedPost = async () => {
    if (refreshStarted.current) return;
    refreshStarted.current = true;
    setPhase("refreshing");
    setRefreshError(null);
    try {
      const detailKey = postKeys.detail(userId, post.id);
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true });
      const updatedPost = await getPost(post.id);
      queryClient.setQueryData(detailKey, updatedPost);
      onSaved();
    } catch (error) {
      setRefreshError(errorMessage(error, "최신 글을 불러오지 못했어요."));
      setPhase("saved-unconfirmed");
    } finally {
      refreshStarted.current = false;
    }
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || !draft || saveStarted.current) return;
    saveStarted.current = true;
    setPhase("saving");
    try {
      await saveMutation.mutateAsync({
        postId: post.id,
        title: title.trim(),
        draft,
        existingImageIds: initial.existingImageIds,
      });
    } catch {
      saveStarted.current = false;
      setPhase("editing");
      return;
    }

    // The PATCH response has no rich body or image list. Read it back before closing.
    void queryClient.invalidateQueries({ queryKey: ["posts", "list", userId] });
    await refreshSavedPost();
  };

  const handleCancel = () => {
    if (!isLocked && !saveStarted.current) onCancel();
  };

  return (
    <form className="post-edit-form" aria-label="게시글 수정" onSubmit={handleSubmit}>
      <header className="post-edit-form__heading">
        <h1 id="post-detail-title">이야기 수정</h1>
        <p>제목과 본문을 수정하고, 사진을 추가하거나 순서를 바꿀 수 있어요.</p>
      </header>

      {initial.error || !initial.draft ? (
        <div className="post-edit-form__status">
          <Notice>{initial.error} 원문은 변경되지 않았어요.</Notice>
          <Button variant="secondary" onClick={handleCancel} aria-label="게시글 수정 취소">
            돌아가기
          </Button>
        </div>
      ) : (
        <>
          <div className="editor-title-field">
            <label className="editor-title-label" htmlFor="post-edit-title">제목</label>
            <input
              id="post-edit-title"
              name="title"
              className="input editor-title-input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-describedby="post-edit-title-hint"
              maxLength={100}
              disabled={isLocked}
              required
              autoFocus
            />
            <div className="editor-title-meta">
              <span id="post-edit-title-hint">100자 이내로 입력해 주세요.</span>
              <span>{title.length} / 100</span>
            </div>
          </div>

          <Suspense fallback={<LoadingState label="수정 도구를 준비하고 있어요." />}>
            <RichPostEditor
              initialContent={initial.draft.contentJson}
              onChange={setDraft}
              disabled={isLocked}
            />
          </Suspense>

          {validation.error && <Notice>{validation.error}</Notice>}
          {saveMutation.isError && phase === "editing" && (
            <Notice>{saveMutation.error.message} 작성 중인 제목과 본문은 유지돼요.</Notice>
          )}

          {(phase === "refreshing" || phase === "saved-unconfirmed") && (
            <div className="post-edit-form__status">
              {phase === "refreshing" ? (
                <LoadingState label="저장한 이야기를 불러오고 있어요." />
              ) : (
                <>
                  <Notice>
                    저장됐지만 최신 글을 불러오지 못했어요. 아래 버튼으로 저장된 내용을 다시 확인해 주세요.
                    {refreshError && <span className="post-edit-form__reason">{refreshError}</span>}
                  </Notice>
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label="저장된 게시글 다시 불러오기"
                    onClick={() => void refreshSavedPost()}
                  >
                    저장된 글 다시 불러오기
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="post-edit-form__footer">
            <span className="editor-count">
              {(draft?.text.length ?? initial.draft.text.length).toLocaleString("ko-KR")}
              {" / "}{MAX_POST_TEXT_LENGTH.toLocaleString("ko-KR")}자
            </span>
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                aria-label="게시글 수정 취소"
                disabled={isLocked}
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button type="submit" aria-label="게시글 수정 저장" disabled={!canSave}>
                {phase === "saving" ? "저장 중..."
                  : phase === "refreshing" ? "불러오는 중..."
                    : phase === "saved-unconfirmed" ? "저장 완료" : "수정 저장"}
              </Button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
