import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "../api/auth";
import { getPostReaction, likePost, unlikePost } from "../api/post";
import LikeButton from "../components/LikeButton";
import { Button, Notice } from "../components/ui";

export default function PostReaction({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
  const reactionKey = ["reactions", postId, me?.id];
  const reactionQuery = useQuery({
    queryKey: reactionKey,
    queryFn: () => getPostReaction(postId),
    enabled: me !== undefined,
    retry: false,
  });

  const reactionMutation = useMutation({
    mutationFn: (alreadyLiked: boolean) =>
      alreadyLiked ? unlikePost(postId) : likePost(postId),
    // Refresh after failures too: a lost response can still mean the server saved it.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: reactionKey, exact: true }),
  });

  const handleToggle = () => {
    if (
      !reactionQuery.data ||
      reactionQuery.isError ||
      reactionQuery.isFetching ||
      reactionMutation.isPending
    ) {
      return;
    }

    reactionMutation.mutate(reactionQuery.data.reactedByMe);
  };

  return (
    <div className="post-reaction">
      <div className="post-reaction__actions">
        <LikeButton
          liked={reactionQuery.data?.reactedByMe ?? false}
          count={reactionQuery.data?.reactionCount}
          pending={reactionMutation.isPending}
          disabled={
            !reactionQuery.data ||
            reactionQuery.isError ||
            reactionQuery.isFetching
          }
          onToggle={handleToggle}
        />
        {reactionQuery.isPending && (
          <span className="post-reaction__status" role="status">
            좋아요를 불러오는 중...
          </span>
        )}
      </div>

      {reactionQuery.isError ? (
        <div className="post-reaction__feedback">
          <Notice>좋아요 상태를 불러오지 못했어요. 다시 시도해 주세요.</Notice>
          <Button
            variant="secondary"
            size="sm"
            disabled={reactionQuery.isFetching}
            onClick={() => void reactionQuery.refetch()}
          >
            {reactionQuery.isFetching ? "불러오는 중..." : "다시 불러오기"}
          </Button>
        </div>
      ) : reactionMutation.isError ? (
        <Notice>좋아요 요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.</Notice>
      ) : null}
    </div>
  );
}
