import Icon from "./Icon";
import { Button } from "./ui";

type LikeButtonProps = {
  liked?: boolean;
  count?: number;
  pending?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
};

export default function LikeButton({
  liked = false,
  count,
  pending = false,
  disabled = false,
  onToggle,
}: LikeButtonProps) {
  const unavailable = !onToggle;
  const action = liked ? "좋아요 취소" : "좋아요";

  return (
    <Button
      className="like-button"
      variant="ghost"
      type="button"
      aria-pressed={liked}
      aria-busy={pending}
      aria-label={count === undefined ? action : `${action}, ${count}개`}
      disabled={disabled || pending || unavailable}
      title={unavailable ? "좋아요 기능을 준비하고 있어요" : action}
      onClick={onToggle}
    >
      <Icon
        name="heart"
        size={18}
        fill={liked ? "currentColor" : "none"}
      />
      <span>{pending ? "처리 중..." : "좋아요"}</span>
      {count !== undefined && (
        <span className="like-button__count">
          {count.toLocaleString("ko-KR")}
        </span>
      )}
    </Button>
  );
}
