import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";
import { createComment, deleteComment, getComments } from "../api/post";
import { getMe } from "../api/auth";
import { commentKeys, postKeys } from "../api/postKeys";
import Icon from "../components/Icon";
import { Avatar, Button, Card, LoadingState, Notice } from "../components/ui";
import { formatDate } from "../lib/format";

interface CommentComponentI {
  postId: number;
}

const CommentComponent = ({ postId }: CommentComponentI) => {
  const [text, setText] = useState("");
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

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim() || createCommentMutation.isPending) return;
    createCommentMutation.mutate({ id: postId, content: text });
  };

  const handleDelete = (commentId: number) => {
    if (deleteCommentMutation.isPending) return;
    deleteCommentMutation.mutate({ postId, commentId });
  };

  return (
    <Card className="comments-panel">
      <div className="comments-heading">
        <h2>함께 나눈 이야기</h2>
        {commentsQuery.data && (
          <span className="comments-count">{commentsQuery.data.length}</span>
        )}
      </div>

      {commentsQuery.isPending ? (
        <LoadingState label="댓글을 불러오고 있어요." />
      ) : commentsQuery.isError ? (
        <div className="comment-empty">
          <Notice>댓글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Notice>
          <Button variant="secondary" size="sm" onClick={() => commentsQuery.refetch()}>
            다시 불러오기
          </Button>
        </div>
      ) : commentsQuery.data.length === 0 ? (
        <div className="comment-empty">
          <Icon name="message" size={24} />
          <p>아직 댓글이 없어요. 첫 번째 이야기를 남겨보세요.</p>
        </div>
      ) : (
        <div className="comment-list">
          {commentsQuery.data.map((comment) => {
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
                      <Button
                        className="comment-delete"
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                        aria-label={`${comment.authorNameSnapshot}의 댓글 삭제`}
                      >
                        <Icon name="trash" size={14} />
                        {isDeleting ? "삭제 중..." : "삭제"}
                      </Button>
                    )}
                  </div>
                  <p className="comment-item__content">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
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
          disabled={createCommentMutation.isPending}
          required
          rows={3}
        />
        {createCommentMutation.isError && (
          <Notice>댓글을 작성하지 못했어요. 입력한 내용을 확인하고 다시 시도해 주세요.</Notice>
        )}
        <div className="comment-composer__footer">
          <span className="muted">서로의 이야기를 존중해 주세요.</span>
          <Button type="submit" size="sm" disabled={!text.trim() || createCommentMutation.isPending}>
            {createCommentMutation.isPending ? "게시 중..." : "댓글 게시"}
            <Icon name="arrow-right" size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CommentComponent;
