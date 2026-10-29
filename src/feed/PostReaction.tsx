import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likePost, unlikePost, type PostSummaryResponse } from "../api/post";
import { postKeys } from "../api/postKeys";
import LikeButton from "../components/LikeButton";
import { Notice } from "../components/ui";

type PostReactionProps = {
  post: PostSummaryResponse;
  disabled?: boolean;
};

export default function PostReaction({
  post,
  disabled = false,
}: PostReactionProps) {
  const queryClient = useQueryClient();
  const reactionMutation = useMutation({
    mutationFn: (alreadyLiked: boolean) =>
      alreadyLiked ? unlikePost(post.id) : likePost(post.id),
    // The post response owns the count and the current user's reaction state.
    // Refetch after errors too, since the server may have received the request.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: postKeys.all }),
  });

  const handleToggle = () => {
    if (disabled || reactionMutation.isPending) return;
    reactionMutation.mutate(post.reactedByMe);
  };

  return (
    <div className="post-reaction">
      <LikeButton
        liked={post.reactedByMe}
        count={post.reactionCount}
        pending={reactionMutation.isPending}
        disabled={disabled}
        onToggle={handleToggle}
      />
      {reactionMutation.isError && (
        <Notice>
          좋아요 요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.
        </Notice>
      )}
    </div>
  );
}
