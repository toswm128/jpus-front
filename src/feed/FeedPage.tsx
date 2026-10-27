import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getPersonas } from "../api/persona";
import { getPosts } from "../api/post";
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

const FeedPage = () => {
  const postsQuery = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });
  const { data: personas } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
  });
  const selectedPersonaId = Number(localStorage.getItem("personaId"));
  const selectedPersona = personas?.find(
    (persona) => persona.id === selectedPersonaId,
  );

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="COMMUNITY"
        title="모두의 이야기"
        description="다양한 페르소나와 만나고, 당신의 생각을 나눠보세요."
        actions={
          <Link className="button button--primary" to="/posts">
            <Icon name="plus" size={18} />
            새 이야기
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
            <span
              className="composer-prompt__arrow"
              aria-hidden="true"
            >
              <Icon name="pen" size={19} />
            </span>
          </Link>

          <div className="feed-toolbar">
            <h2>최신 이야기</h2>
            {postsQuery.data && (
              <span className="feed-count">{postsQuery.data.length}개의 이야기</span>
            )}
          </div>

          {postsQuery.isPending ? (
            <LoadingState label="이야기를 불러오고 있어요." />
          ) : postsQuery.isError ? (
            <Card className="error-card">
              <Notice>이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Notice>
              <div className="inline-actions">
                <Button variant="secondary" onClick={() => postsQuery.refetch()}>
                  다시 불러오기
                </Button>
              </div>
            </Card>
          ) : postsQuery.data.length === 0 ? (
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
          ) : (
            <div className="feed-list">
              {postsQuery.data.map((post) => (
                <Link className="post-card" to={`/posts/${post.id}`} key={post.id}>
                  <div className="post-card__header">
                    <div className="author">
                      <Avatar name={post.authorNameSnapshot} />
                      <div className="author__meta">
                        <span className="author__name">{post.authorNameSnapshot}</span>
                        <time className="author__time" dateTime={post.createdAt}>
                          {formatDate(post.createdAt)}
                        </time>
                      </div>
                    </div>
                    <Icon className="post-card__arrow" name="arrow-up-right" size={18} />
                  </div>
                  <p className="post-card__content">{post.content}</p>
                  <div className="post-card__footer">
                    <span>이야기 읽기</span>
                    <Icon name="arrow-right" size={16} />
                  </div>
                </Link>
              ))}
            </div>
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
                    <h2 className="rail-card__title">{selectedPersona.displayName}</h2>
                    <span className="muted">나의 공개 프로필</span>
                  </div>
                </div>
                {selectedPersona.bio && (
                  <p className="rail-card__description">{selectedPersona.bio}</p>
                )}
              </>
            ) : (
              <p className="rail-card__description">이야기를 나눌 페르소나를 선택해 보세요.</p>
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
              취향도, 관심사도, 이야기하는 모습도 다양하니까요.
              페르소나마다 새로운 이야기를 시작해 보세요.
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
