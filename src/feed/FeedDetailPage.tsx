import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import { getMe } from "../api/auth";
import { getPost } from "../api/post";
import { postKeys } from "../api/postKeys";
import Icon from "../components/Icon";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Notice,
} from "../components/ui";
import { formatDate } from "../lib/format";
import CommentComponent from "./CommentComponent";
import PostReaction from "./PostReaction";
import PostContent from "./PostContent";

const FeedDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const postId = Number(id);
  const isValidPostId = Number.isSafeInteger(postId) && postId > 0;
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
  const postQuery = useQuery({
    queryKey: postKeys.detail(me?.id, postId),
    queryFn: () => getPost(postId),
    enabled: isValidPostId && me !== undefined,
  });
  const post = postQuery.data;
  const search = searchParams.toString();
  const feedUrl = search ? "/?" + search : "/";
  const contentKey = String(me?.id) + ":" + postId;

  return (
    <div className="page-stack">
      <Link className="back-link" to={feedUrl}>
        <Icon name="arrow-left" size={17} />
        모든 이야기
      </Link>

      {!isValidPostId ? (
        <EmptyState
          icon={<Icon name="message" size={26} />}
          title="이야기를 찾을 수 없어요"
          description="게시글 주소를 다시 확인하거나, 다른 이야기를 만나보세요."
          action={
            <Link className="button button--secondary" to={feedUrl}>
              피드로 돌아가기
            </Link>
          }
        />
      ) : postQuery.isPending ? (
        <LoadingState label="이야기를 불러오고 있어요." />
      ) : !post ? (
        <Card className="error-card">
          <Notice>
            이야기를 불러오지 못했어요. 삭제된 글이거나 잠시 연결이 원활하지
            않을 수 있어요.
          </Notice>
          <Button
            variant="secondary"
            disabled={postQuery.isFetching}
            onClick={() => void postQuery.refetch()}
          >
            다시 불러오기
          </Button>
        </Card>
      ) : (
        <>
          {postQuery.isError && (
            <Card className="error-card">
              <Notice>
                최신 정보를 불러오지 못했어요. 현재 표시된 이야기는 이전에
                불러온 내용이에요.
              </Notice>
              <Button
                variant="secondary"
                size="sm"
                disabled={postQuery.isFetching}
                onClick={() => void postQuery.refetch()}
              >
                {postQuery.isFetching ? "불러오는 중..." : "다시 불러오기"}
              </Button>
            </Card>
          )}

          <Card className="post-detail">
            <article aria-labelledby="post-detail-title">
              <div className="post-detail__header">
                <div className="author">
                  <Avatar name={post.authorNameSnapshot} size="lg" />
                  <div className="author__meta">
                    <span className="author__name">{post.authorNameSnapshot}</span>
                    <time className="author__time" dateTime={post.createdAt}>
                      {formatDate(post.createdAt)}
                    </time>
                  </div>
                </div>
                <span className="muted">#{post.id}</span>
              </div>

              <h1 id="post-detail-title" className="post-detail__title">
                {post.title?.trim() || "제목 없는 이야기"}
              </h1>
              <PostContent
                postId={post.id}
                content={post.content}
                contentJson={post.contentJson}
                images={post.images}
              />

              <div className="post-detail__footer post-detail__actions">
                <PostReaction
                  key={contentKey}
                  post={post}
                  disabled={postQuery.isFetching || postQuery.isError}
                />
                <a className="post-comments-link" href="#post-comments">
                  <Icon name="message" size={17} />
                  댓글 {post.commentCount.toLocaleString("ko-KR")}
                </a>
                {post.updatedAt && (
                  <span className="post-detail__edited">수정된 이야기</span>
                )}
              </div>
            </article>
          </Card>

          <section id="post-comments" aria-label="게시글 댓글">
            <CommentComponent key={contentKey} postId={postId} />
          </section>
        </>
      )}
    </div>
  );
};

export default FeedDetailPage;
