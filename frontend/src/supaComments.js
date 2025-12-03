import { supabase } from "../supabaseClient.js";

export async function getUserID() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}

// Realtime listener
export function subscribeToComments(pinId, onChange) {
  const channel = supabase
    .channel(`comments-pin-${pinId}`)
    .on(
      "postgres_changes",
      {
        event: "*", // INSERT, UPDATE, DELETE
        schema: "public",
        table: "comments",
      },
      (payload) => {
        onChange(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // cleanup
  };
}

// Fetch all comments for a pin with their votes
export async function fetchComments(pinId) {
  try {
    // Fetch comments
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("pin_id", pinId)
      .order("created_at", { ascending: false });

    if (commentsError) throw commentsError;

    // Fetch all votes for these comments
    const commentIds = comments.map((c) => c.id);
    let votes = [];

    if (commentIds.length > 0) {
      const { data: votesData, error: votesError } = await supabase
        .from("comment_votes")
        .select("*")
        .in("comment_id", commentIds);

      if (votesError) throw votesError;
      votes = votesData || [];
    }

    // Merge votes into comments
    const commentsWithVotes = comments.map((comment) => {
      const commentVotes = votes.filter((v) => v.comment_id === comment.id);
      const votesMap = {};
      commentVotes.forEach((v) => {
        votesMap[v.user_id] = v.vote;
      });

      return {
        id: comment.id,
        pinId: comment.pin_id,
        parentId: comment.parent_id,
        userId: comment.user_id,
        author: comment.author,
        text: comment.text,
        createdAt: comment.created_at,
        votes: votesMap,
      };
    });

    return commentsWithVotes;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
}

// Add a new comment
export async function addComment({ pinId, parentId, text }) {
  try {
    const userId = await getUserID();
    if (!userId) {
      const err = new Error("Sign in to comment");
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    const commentData = {
      pin_id: pinId,
      parent_id: parentId || null,
      user_id: userId,
      author: "UCSC Member",
      text: text.trim(),
    };

    const { data, error } = await supabase
      .from("comments")
      .insert(commentData)
      .select("*")
      .single();

    if (error) throw error;

    // Convert to frontend format
    return {
      id: data.id,
      pinId: data.pin_id,
      parentId: data.parent_id,
      userId: userId,
      author: data.author,
      text: data.text,
      createdAt: data.created_at,
      votes: {},
    };
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

// Toggle vote on a comment (upvote or downvote)
export async function toggleVote({ commentId, vote }) {
  try {
    const userId = await getUserID();
    if (!userId) {
      const err = new Error("Sign in to vote");
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    // Check if user already voted
    const { data: existing, error: fetchError } = await supabase
      .from("comment_votes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      // If same vote, remove it (toggle off)
      if (existing.vote === vote) {
        const { error: deleteError } = await supabase
          .from("comment_votes")
          .delete()
          .eq("id", existing.id);

        if (deleteError) throw deleteError;
        return { action: "removed", vote: null };
      } else {
        // Update to new vote value
        const { error: updateError } = await supabase
          .from("comment_votes")
          .update({ vote })
          .eq("id", existing.id);

        if (updateError) throw updateError;
        return { action: "updated", vote };
      }
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from("comment_votes")
        .insert({
          comment_id: commentId,
          user_id: userId,
          vote,
        });

      if (insertError) throw insertError;
      return { action: "added", vote };
    }
  } catch (error) {
    console.error("Error toggling vote:", error);
    throw error;
  }
}

// Delete a comment (only owner can delete)
export async function deleteComment(commentId) {
  try {
    const userId = await getUserID();
    if (!userId) {
      const err = new Error("Not authenticated");
      err.code = "AUTH_REQUIRED";
      throw err;
    }

    // Fetch to check ownership
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (fetchError) throw fetchError;

    if (comment.user_id !== userId) {
      const err = new Error("You can only delete your own comments");
      err.code = "AUTH_DENIED";
      throw err;
    }

    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}
