import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";
import {
  createComment,
  deleteComment,
  getComments,
  MAX_COMMENT_LENGTH,
  updateComment,
  type comment as CommentData,
} from "../api/post";
import { getMe } from "../api/auth";
import { commentKeys, postKeys } from "../api/postKeys";
import Icon from "../components/Icon";
import { Avatar, Button, Card, LoadingState, Notice } from "../components/ui";
import { formatDate } from "../lib/format";
import "./CommentComponent.css";

interface CommentComponentI {
  postId: number;
}

const CommentComponent = ({ postId }: CommentComponentI) => {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const commentsKey = commentKeys.list(me?.id, postId);
  const commentsQuery = useQuery({
    queryKey: commentsKey,
    queryFn: () => getComments(postId),
    enabled: me !== undefined,
  });

  const refreshCommentsAndCounts = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: commentsKey, exact: true }),
      queryClient.invalidateQueries({ queryKey: postKeys.all }),
    ]);

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: refreshCommentsAndCounts,
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: async () => {
      setText("");
      await refreshCommentsAndCounts();
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: updateComment,
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<CommentData[]>(commentsKey, (comments) =>
        comments?.map((comment) =>
          comment.id === updatedComment.id ? updatedComment : comment,
        ),
      );
      return queryClient.invalidateQueries({ queryKey: commentsKey, exact: true });
    },
  });

  const comments = commentsQuery.data;
  const editingComment = comments?.find(
    (comment) => comment.id === editingId && comment.isMine,
  );
  const isMutationPending = createCommentMutation.isPending
    || deleteCommentMutation.isPending
    || updateCommentMutation.isPending;
  const isMissingEditTarget = editingId !== null && !editingComment;
  const canSave = editingComment !== undefined
    && editText.trim().length > 0
    && editText !== editingComment.content
    && editText.length <= MAX_COMMENT_LENGTH
    && !isMutationPending;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim() || text.length > MAX_COMMENT_LENGTH || isMutationPending) return;
    createCommentMutation.mutate({ id: postId, content: text });
  };

  const handleDelete = (commentId: number) => {
    if (isMutationPending || editingId !== null) return;
    if (!comments?.some((comment) => comment.id === commentId && comment.isMine)) return;
    deleteCommentMutation.mutate({ postId, commentId });
  };

  const handleStartEdit = (commentId: number) => {
    if (isMutationPending || editingId !== null) return;
    const comment = comments?.find((item) => item.id === commentId && item.isMine);
    if (!comment) return;
    updateCommentMutation.reset();
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const handleCancelEdit = () => {
    if (isMutationPending) return;
    setEditingId(null);
    setEditText("");
    updateCommentMutation.reset();
  };

  const handleSaveEdit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || editingId === null) return;
    // A background refresh may have removed the comment or changed its ownership.
    const currentComment = commentsQuery.data?.find(
      (comment) => comment.id === editingId && comment.isMine,
    );
    if (!currentComment || editText === currentComment.content) return;

    try {
      await updateCommentMutation.mutateAsync({
        postId,
        commentId: editingId,
        content: editText,
      });
      setEditingId(null);
      setEditText("");
      updateCommentMutation.reset();
    } catch {
      // The mutation error is shown beside the unchanged edit draft.
    }
  };

  const editForm = editingId === null ? null : (
    <form className="comment-edit-form" onSubmit={handleSaveEdit}>
      <label htmlFor={`comment-edit-${editingId}`}>댓글 수정 내용</label>
      {isMissingEditTarget && (
        <Notice>
          댓글이 삭제되었거나 수정할 수 없어요. 입력한 내용은 유지되니 필요한 내용을 복사한 뒤 취소해 주세요.
        </Notice>
      )}
      <textarea
        id={`comment-edit-${editingId}`}
        className="textarea comment-edit-form__field"
        value={editText}
        onChange={(event) => setEditText(event.target.value)}
        aria-describedby={`comment-edit-${editingId}-hint`}
        disabled={isMutationPending}
        maxLength={MAX_COMMENT_LENGTH}
        rows={3}
        required
        autoFocus
      />
      {updateCommentMutation.isError && (
        <Notice>{updateCommentMutation.error.message}</Notice>
      )}
      {editText.length > MAX_COMMENT_LENGTH && (
        <Notice>댓글은 {MAX_COMMENT_LENGTH}자 이내로 작성해 주세요.</Notice>
      )}
      <div className="comment-edit-form__footer">
        <span id={`comment-edit-${editingId}-hint`} className="comment-edit-form__count">
          {editText.length} / {MAX_COMMENT_LENGTH}자
        </span>
        <div className="comment-edit-form__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="댓글 수정 취소"
            onClick={handleCancelEdit}
            disabled={isMutationPending}
          >
            취소
          </Button>
          <Button
            type="submit"
            size="sm"
            aria-label="댓글 수정 저장"
            disabled={!canSave}
          >
            {updateCommentMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <Card className="comments-panel">
      <div className="comments-heading">
        <h2>함께 나눈 이야기</h2>
        {comments && (
          <span className="comments-count">{comments.length}</span>
        )}
      </div>

      {commentsQuery.isPending ? (
        <LoadingState label="댓글을 불러오고 있어요." />
      ) : !comments ? (
        <div className="comment-empty">
          <Notice>댓글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Notice>
          <Button variant="secondary" size="sm" onClick={() => void commentsQuery.refetch()}>
            다시 불러오기
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <div className="comment-empty">
          <Icon name="message" size={24} />
          <p>아직 댓글이 없어요. 첫 번째 이야기를 남겨보세요.</p>
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => {
            const isDeleting = deleteCommentMutation.isPending &&
              deleteCommentMutation.variables?.commentId === comment.id;

            return (
              <div className="comment-item" key={comment.id}>
                <Avatar name={comment.authorNameSnapshot} size="sm" />
                <div className="comment-item__body">
                  <div className="comment-item__header">
                    <span className="author__name">{comment.authorNameSnapshot}</span>
                    {comment.isMine && <span className="comment-mine">나</span>}
                    <time className="author__time" dateTime={comment.createdAt}>
                      {formatDate(comment.createdAt)}
                    </time>
                    {comment.isMine && (
                      <div className="comment-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleStartEdit(comment.id)}
                          disabled={isMutationPending || editingId !== null}
                          aria-label={`${comment.authorNameSnapshot}의 댓글 수정`}
                        >
                          <Icon name="pen" size={14} />
                          수정
                        </Button>
                        <Button
                          className="comment-delete"
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          disabled={isMutationPending || editingId !== null}
                          aria-label={`${comment.authorNameSnapshot}의 댓글 삭제`}
                        >
                          <Icon name="trash" size={14} />
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingComment?.id === comment.id ? editForm : (
                    <p className="comment-item__content">{comment.content}</p>
                  )}
                  {comment.updatedAt && (
                    <p className="comment-item__updated">
                      <time
                        dateTime={comment.updatedAt}
                        title={`마지막 수정: ${formatDate(comment.updatedAt)}`}
                      >
                        수정됨 · {formatDate(comment.updatedAt)}
                      </time>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {commentsQuery.isError && comments && (
        <div className="comment-refresh-error">
          <Notice>
            최신 댓글을 불러오지 못했어요. 마지막으로 확인한 내용과 수정 중인 입력은 유지돼요.
          </Notice>
          <Button
            variant="secondary"
            size="sm"
            disabled={commentsQuery.isFetching || isMutationPending}
            onClick={() => void commentsQuery.refetch()}
          >
            다시 불러오기
          </Button>
        </div>
      )}

      {isMissingEditTarget && (
        <div className="comment-edit-recovery">{editForm}</div>
      )}

      {deleteCommentMutation.isError && (
        <Notice>댓글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.</Notice>
      )}

      <form className="comment-composer" onSubmit={handleSubmit}>
        <label htmlFor="comment-content">댓글 남기기</label>
        <textarea
          id="comment-content"
          className="textarea comment-composer__field"
          placeholder="이 이야기에 대한 생각을 나눠주세요."
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={isMutationPending}
          maxLength={MAX_COMMENT_LENGTH}
          required
          rows={3}
        />
        {createCommentMutation.isError && (
          <Notice>댓글을 작성하지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.</Notice>
        )}
        <div className="comment-composer__footer">
          <span className="comment-composer__hint">
            <span>서로의 이야기를 존중해 주세요.</span>
            <span>{text.length} / {MAX_COMMENT_LENGTH}자</span>
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || text.length > MAX_COMMENT_LENGTH || isMutationPending}
          >
            {createCommentMutation.isPending ? "게시 중..." : "댓글 게시"}
            <Icon name="arrow-right" size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CommentComponent;
