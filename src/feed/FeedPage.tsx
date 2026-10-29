import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { getMe } from "../api/auth";
import { getPersonas } from "../api/persona";
import { getPosts } from "../api/post";
import { postKeys } from "../api/postKeys";
import Icon from "../components/Icon";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Notice,
  PageHeader,
} from "../components/ui";
import { formatDate } from "../lib/format";

const PAGE_SIZE = 20;
const MAX_PAGE = Math.floor(2_147_483_647 / PAGE_SIZE);

function parsePage(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) return 0;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 0 && page <= MAX_PAGE
    ? page
    : 0;
}

const FeedPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
  const postsQuery = useQuery({
    queryKey: postKeys.list(me?.id, page, PAGE_SIZE),
    queryFn: () => getPosts(page, PAGE_SIZE),
    enabled: me !== undefined,
  });
  const { data: personas } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
  });
  const selectedPersonaId = Number(localStorage.getItem("personaId"));
  const selectedPersona = personas?.find(
    (persona) => persona.id === selectedPersonaId,
  );
  const currentPage = postsQuery.data?.page.number ?? page;
  const totalPages = postsQuery.data?.page.totalPages ?? 0;
  const firstPageNumber = Math.max(0, Math.min(currentPage - 1, totalPages - 3));
  const nearbyPages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => firstPageNumber + index,
  );
  const detailSearchParams = new URLSearchParams(searchParams);
  detailSearchParams.set("page", String(page));
  const detailSearch = "?" + detailSearchParams.toString();

  const changePage = (nextPage: number) => {
    if (postsQuery.isFetching || nextPage < 0) return;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("page", String(nextPage));
      return next;
    });
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="COMMUNITY"
        title="모두의 이야기"
        description="다양한 페르소나와 만나고, 당신의 생각을 나눠보세요."
        actions={
          <Link className="button button--primary" to="/posts">
            <Icon name="plus" size={18} />새 이야기
          </Link>
        }
      />

      <div className="feed-layout">
        <section className="feed-main" aria-label="전체 피드">
          <Link className="composer-prompt" to="/posts">
            <Avatar name={selectedPersona?.displayName ?? "나"} />
            <span className="composer-prompt__input">
              지금 어떤 생각을 하고 있나요?
            </span>
            <span className="composer-prompt__arrow" aria-hidden="true">
              <Icon name="pen" size={19} />
            </span>
          </Link>

          <div className="feed-toolbar">
            <h2>최신 이야기</h2>
            {postsQuery.data && (
              <span className="feed-count">
                {postsQuery.data.page.totalElements.toLocaleString("ko-KR")}개의 이야기
              </span>
            )}
          </div>

          {postsQuery.isPending ? (
            <LoadingState label="이야기를 불러오고 있어요." />
          ) : postsQuery.isError ? (
            <Card className="error-card">
              <Notice>
                이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
              </Notice>
              <div className="inline-actions">
                <Button
                  variant="secondary"
                  disabled={postsQuery.isFetching}
                  onClick={() => postsQuery.refetch()}
                >
                  {postsQuery.isFetching ? "불러오는 중..." : "다시 불러오기"}
                </Button>
              </div>
            </Card>
          ) : postsQuery.data.page.totalElements === 0 ? (
            <EmptyState
              icon={<Icon name="message" size={26} />}
              title="첫 번째 이야기를 들려주세요"
              description="아직 올라온 이야기가 없어요. 가벼운 인사로 시작해도 좋아요."
              action={
                <Link className="button button--primary" to="/posts">
                  <Icon name="plus" size={17} />
                  이야기 쓰기
                </Link>
              }
            />
          ) : postsQuery.data.content.length === 0 ? (
            <EmptyState
              icon={<Icon name="message" size={26} />}
              title="이 페이지에는 이야기가 없어요"
              description="글이 삭제되었거나 마지막 페이지를 지난 주소일 수 있어요. 첫 페이지에서 이야기를 다시 만나보세요."
              action={
                <Button
                  variant="secondary"
                  disabled={postsQuery.isFetching}
                  onClick={() => changePage(0)}
                >
                  첫 페이지로 돌아가기
                </Button>
              }
            />
          ) : (
            <div className="feed-list">
              {postsQuery.data.content.map((post) => (
                <Link
                  className="post-card"
                  to={{ pathname: `/posts/${post.id}`, search: detailSearch }}
                  key={post.id}
                >
                  <div className="post-card__header">
                    <div className="author">
                      <Avatar name={post.authorNameSnapshot} />
                      <div className="author__meta">
                        <span className="author__name">
                          {post.authorNameSnapshot}
                        </span>
                        <time
                          className="author__time"
                          dateTime={post.createdAt}
                        >
                          {formatDate(post.createdAt)}
                        </time>
                      </div>
                    </div>
                    <Icon
                      className="post-card__arrow"
                      name="arrow-up-right"
                      size={18}
                    />
                  </div>
                  <h2 className="post-card__title">
                    {post.title?.trim() || "제목 없는 이야기"}
                  </h2>
                  <p className="post-card__content">{post.content}</p>
                  <div className="post-card__footer">
                    <span className="post-card__stats">
                      <span className="post-stat" role="img" aria-label={`댓글 ${post.commentCount}개`}>
                        <Icon name="message" size={15} />
                        <span>{post.commentCount.toLocaleString("ko-KR")}</span>
                      </span>
                      <span
                        className={"post-stat" + (post.reactedByMe ? " post-stat--liked" : "")}
                        role="img"
                        aria-label={`${post.reactedByMe ? "내가 좋아요한 이야기, " : ""}좋아요 ${post.reactionCount}개`}
                      >
                        <Icon name="heart" size={15} fill={post.reactedByMe ? "currentColor" : "none"} />
                        <span>{post.reactionCount.toLocaleString("ko-KR")}</span>
                      </span>
                    </span>
                    <Icon name="arrow-right" size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {postsQuery.isSuccess && postsQuery.data.content.length > 0 && totalPages > 1 && (
            <nav className="feed-pagination" aria-label="피드 페이지">
              <div className="pagination-controls">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={postsQuery.isFetching || currentPage === 0}
                  onClick={() => changePage(currentPage - 1)}
                >
                  <Icon name="arrow-left" size={15} />
                  이전
                </Button>
                <div className="pagination-pages">
                  {nearbyPages.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      className={"pagination-page" + (pageNumber === currentPage ? " pagination-page--current" : "")}
                      variant={pageNumber === currentPage ? "primary" : "ghost"}
                      size="sm"
                      disabled={postsQuery.isFetching || pageNumber === currentPage}
                      aria-label={`${pageNumber + 1}페이지로 이동`}
                      aria-current={pageNumber === currentPage ? "page" : undefined}
                      onClick={() => changePage(pageNumber)}
                    >
                      {pageNumber + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={postsQuery.isFetching || currentPage >= totalPages - 1}
                  onClick={() => changePage(currentPage + 1)}
                >
                  다음
                  <Icon name="arrow-right" size={15} />
                </Button>
              </div>
              <p className="pagination-summary" aria-live="polite">
                {currentPage + 1} / {totalPages.toLocaleString("ko-KR")} 페이지
              </p>
            </nav>
          )}
        </section>

        <aside className="feed-rail" aria-label="내 페르소나와 커뮤니티 안내">
          <Card className="rail-card">
            <p className="rail-card__eyebrow">지금 활동 중인 페르소나</p>
            {selectedPersona ? (
              <>
                <div className="active-persona">
                  <Avatar name={selectedPersona.displayName} size="lg" />
                  <div className="active-persona__info">
                    <h2 className="rail-card__title">
                      {selectedPersona.displayName}
                    </h2>
                    <span className="muted">나의 공개 프로필</span>
                  </div>
                </div>
                {selectedPersona.bio && (
                  <p className="rail-card__description">
                    {selectedPersona.bio}
                  </p>
                )}
              </>
            ) : (
              <p className="rail-card__description">
                이야기를 나눌 페르소나를 선택해 보세요.
              </p>
            )}
            <Link className="button button--secondary" to="/persona">
              <Icon name="users" size={17} />
              페르소나 바꾸기
            </Link>
          </Card>

          <Card className="rail-card community-guide">
            <Icon name="sparkles" size={24} />
            <h2 className="rail-card__title">여러 모습의 나를 만나는 곳</h2>
            <p className="rail-card__description">
              취향도, 관심사도, 이야기하는 모습도 다양하니까요. 페르소나마다
              새로운 이야기를 시작해 보세요.
            </p>
            <Link className="back-link" to="/persona/create">
              새로운 페르소나 만들기
              <Icon name="arrow-right" size={16} />
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default FeedPage;
