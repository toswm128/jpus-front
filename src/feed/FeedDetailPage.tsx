import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { getPost } from "../api/post";
import Icon from "../components/Icon";
import { Avatar, Card, EmptyState, LoadingState, Notice } from "../components/ui";
import { formatDate } from "../lib/format";
import CommentComponent from "./CommentComponent";

const FeedDetailPage = () => {
  const { id } = useParams();
  const postId = Number(id);
  const isValidPostId = Number.isSafeInteger(postId) && postId > 0;

  const postQuery = useQuery({
    queryKey: ["posts", id],
    queryFn: () => getPost(postId),
    enabled: isValidPostId,
  });

  return (
    <div className="page-stack">
      <Link className="back-link" to="/">
        <Icon name="arrow-left" size={17} />
        모든 이야기
      </Link>

      {!isValidPostId ? (
        <EmptyState
          icon={<Icon name="message" size={26} />}
          title="이야기를 찾을 수 없어요"
          description="게시글 주소를 다시 확인하거나, 다른 이야기를 만나보세요."
          action={<Link className="button button--secondary" to="/">피드로 돌아가기</Link>}
        />
      ) : postQuery.isPending ? (
        <LoadingState label="이야기를 불러오고 있어요." />
      ) : postQuery.isError ? (
        <Card className="error-card">
          <Notice>이야기를 불러오지 못했어요. 삭제된 글이거나 잠시 연결이 원활하지 않을 수 있어요.</Notice>
        </Card>
      ) : (
        <>
          <Card className="post-detail">
            <article aria-labelledby="post-detail-title">
              <div className="post-detail__header">
                <div className="author">
                  <Avatar name={postQuery.data.authorNameSnapshot} size="lg" />
                  <div className="author__meta">
                    <h1 id="post-detail-title" className="author__name">
                      {postQuery.data.authorNameSnapshot}의 이야기
                    </h1>
                    <time className="author__time" dateTime={postQuery.data.createdAt}>
                      {formatDate(postQuery.data.createdAt)}
                    </time>
                  </div>
                </div>
                <span className="muted">#{postQuery.data.id}</span>
              </div>
              <div className="post-detail__body">{postQuery.data.content}</div>
              <div className="post-detail__footer">
                <Icon name="message" size={16} />
                <span>아래에서 이야기를 이어가 보세요.</span>
                {postQuery.data.updatedAt && <span className="muted">수정된 이야기</span>}
              </div>
            </article>
          </Card>
          <CommentComponent postId={postId} />
        </>
      )}
    </div>
  );
};

export default FeedDetailPage;
