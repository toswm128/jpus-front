import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { getPersonas } from "../api/persona";
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

const PersonaPage = () => {
  const { isPending, isError, data: personas, refetch } = useQuery({
    queryKey: ["personas"],
    queryFn: getPersonas,
  });
  const navigate = useNavigate();
  const selectedPersonaId = Number(localStorage.getItem("personaId"));

  const handleSelect = (personaId: number) => {
    localStorage.setItem("personaId", personaId.toString());
    navigate("/");
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR IDENTITIES"
        title="나의 페르소나"
        description="하나의 계정, 여러 개의 나. 지금 이야기하고 싶은 모습으로 시작하세요."
        actions={
          <Link to="/persona/create" className="button button--primary">
            <Icon name="plus" size={18} />
            페르소나 만들기
          </Link>
        }
      />

      {isPending ? (
        <LoadingState label="페르소나를 불러오고 있어요" />
      ) : isError ? (
        <div className="page-stack">
          <Notice tone="error">
            페르소나를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </Notice>
          <div>
            <Button variant="secondary" onClick={() => void refetch()}>
              다시 불러오기
            </Button>
          </div>
        </div>
      ) : personas?.length === 0 ? (
        <EmptyState
          icon={<Icon name="users" size={28} />}
          title="첫 번째 페르소나를 만들어보세요"
          description="페르소나는 글과 댓글에 표시되는 나의 공개 프로필이에요. 이름과 짧은 소개로 시작할 수 있어요."
          action={
            <Link to="/persona/create" className="button button--primary">
              <Icon name="plus" size={18} />
              첫 페르소나 만들기
            </Link>
          }
        />
      ) : (
        <>
          <Card className="persona-tip">
            <Icon name="users" size={20} />
            <p>활동할 페르소나를 선택하세요. 다른 모습으로 이야기하고 싶을 때 언제든 바꿀 수 있어요.</p>
          </Card>

          <div className="persona-grid">
            {personas?.map((persona) => {
              const isSelected = persona.id === selectedPersonaId;

              return (
                <button
                  key={persona.id}
                  type="button"
                  className={`persona-choice${isSelected ? " persona-choice--selected" : ""}`}
                  aria-pressed={isSelected}
                  aria-label={`${persona.displayName} 페르소나로 활동하기`}
                  onClick={() => handleSelect(persona.id)}
                >
                  <span className="persona-choice-top">
                    <Avatar name={persona.displayName} size="lg" />
                    {isSelected && (
                      <span className="badge badge--accent">
                        <Icon name="check" size={12} />
                        사용 중
                      </span>
                    )}
                  </span>
                  <span className="persona-choice-name">{persona.displayName}</span>
                  <span className="persona-choice-bio">
                    {persona.bio || "아직 소개가 없어요."}
                  </span>
                  <span className="persona-choice-footer">
                    {isSelected ? "피드로 돌아가기" : "이 페르소나로 시작하기"}
                    <Icon name="arrow-right" size={16} />
                  </span>
                </button>
              );
            })}

            <Link to="/persona/create" className="persona-add">
              <Icon name="plus" size={26} />
              <span>새로운 모습 추가하기</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonaPage;
