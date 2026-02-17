import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Edit2, Trash2, X, ThumbsUp, ThumbsDown, Reply } from "lucide-react";
import api from "../../api/axios";
import { auth } from "../../auth/firebase";

const CourseComments = ({ courseId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, popular

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [courseId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/courses/${courseId}/comments`);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await api.post(`/api/courses/${courseId}/comments`, {
        comment_text: newComment.trim(),
      });
      setNewComment("");
      await fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Add reply
  const handleAddReply = async (parentId) => {
    if (!replyText.trim()) return;

    try {
      await api.post(`/api/courses/${courseId}/comments`, {
        comment_text: replyText.trim(),
        parent_comment_id: parentId,
      });
      setReplyText("");
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Failed to add reply");
    }
  };

  // Vote on comment
  const handleVote = async (commentId, voteType) => {
    try {
      const comment = comments.find(c => c.comment_id === commentId);
      // If clicking same vote, remove it (toggle off)
      const newVoteType = comment.user_vote === voteType ? 0 : voteType;
      
      await api.post(`/api/comments/${commentId}/vote`, {
        vote_type: newVoteType,
      });
      await fetchComments();
    } catch (error) {
      console.error("Error voting:", error);
      alert(error.response?.data?.message || "Failed to vote");
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await api.put(`/api/comments/${commentId}`, {
        comment_text: editText.trim(),
      });
      setEditingId(null);
      setEditText("");
      await fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      await fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  // Start editing
  const startEdit = (comment) => {
    setEditingId(comment.comment_id);
    setEditText(comment.comment_text);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // Start replying
  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  // Cancel replying
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Sort comments
  const getSortedComments = () => {
    const rootComments = comments.filter(c => !c.parent_comment_id);
    
    let sorted = [...rootComments];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "popular") {
      sorted.sort((a, b) => b.vote_score - a.vote_score);
    }
    
    return sorted;
  };

  // Get replies for a comment
  const getReplies = (parentId) => {
    return comments
      .filter(c => c.parent_comment_id === parentId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  const currentUserId = auth.currentUser?.uid;

  // Render a single comment
  const renderComment = (comment, isReply = false) => (
    <div key={comment.comment_id} className={`${isReply ? 'ml-12 border-l-2 border-slate-200 pl-4' : ''}`}>
      <div className="p-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {comment.user_name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            {/* User info */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-slate-900 text-sm">
                {comment.user_name || "Anonymous"}
              </span>
              <span className="text-xs text-slate-400">
                {formatDate(comment.created_at)}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-slate-400 italic">
                  (edited)
                </span>
              )}
            </div>

            {/* Comment text or edit form */}
            {editingId === comment.comment_id ? (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateComment(comment.comment_id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed">
                {comment.comment_text}
              </p>
            )}

            {/* Vote and action buttons */}
            {editingId !== comment.comment_id && (
              <div className="flex items-center gap-4 mt-2">
                {/* Upvote */}
                <button
                  onClick={() => handleVote(comment.comment_id, 1)}
                  disabled={comment.user_id === currentUserId}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    comment.user_vote === 1
                      ? "text-indigo-600 font-medium"
                      : "text-slate-500 hover:text-indigo-600"
                  } ${comment.user_id === currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ThumbsUp size={14} fill={comment.user_vote === 1 ? "currentColor" : "none"} />
                  {comment.upvotes}
                </button>

                {/* Downvote */}
                <button
                  onClick={() => handleVote(comment.comment_id, -1)}
                  disabled={comment.user_id === currentUserId}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    comment.user_vote === -1
                      ? "text-red-600 font-medium"
                      : "text-slate-500 hover:text-red-600"
                  } ${comment.user_id === currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <ThumbsDown size={14} fill={comment.user_vote === -1 ? "currentColor" : "none"} />
                  {comment.downvotes}
                </button>

                {/* Vote score */}
                <span className={`text-xs font-medium ${
                  comment.vote_score > 0 ? "text-green-600" : 
                  comment.vote_score < 0 ? "text-red-600" : "text-slate-500"
                }`}>
                  {comment.vote_score > 0 ? "+" : ""}{comment.vote_score}
                </span>

                {/* Reply button (only for root comments) */}
                {!isReply && (
                  <button
                    onClick={() => startReply(comment.comment_id)}
                    className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                  >
                    <Reply size={12} />
                    Reply {comment.reply_count > 0 && `(${comment.reply_count})`}
                  </button>
                )}

                {/* Edit/Delete (only for own comments) */}
                {comment.user_id === currentUserId && (
                  <>
                    <button
                      onClick={() => startEdit(comment)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.comment_id)}
                      className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reply input */}
            {replyingTo === comment.comment_id && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button
                  onClick={() => handleAddReply(comment.comment_id)}
                  disabled={!replyText.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded text-xs font-medium"
                >
                  Reply
                </button>
                <button
                  onClick={cancelReply}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render replies */}
      {!isReply && getReplies(comment.comment_id).map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <MessageSquare size={18} className="text-indigo-600" />
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
          Course Discussion
        </h3>
        <span className="ml-auto text-xs text-slate-500">
          {comments.filter(c => !c.parent_comment_id).length} {comments.filter(c => !c.parent_comment_id).length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Add comment form */}
      <div className="p-4 bg-white border-b border-slate-200">
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Send size={14} />
            {submitting ? "Posting..." : "Post"}
          </button>
        </form>
      </div>

      {/* Sort options */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <span className="text-xs text-slate-600 font-medium">Sort by:</span>
        <button
          onClick={() => setSortBy("newest")}
          className={`text-xs px-2 py-1 rounded ${sortBy === "newest" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"}`}
        >
          Newest
        </button>
        <button
          onClick={() => setSortBy("oldest")}
          className={`text-xs px-2 py-1 rounded ${sortBy === "oldest" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"}`}
        >
          Oldest
        </button>
        <button
          onClick={() => setSortBy("popular")}
          className={`text-xs px-2 py-1 rounded ${sortBy === "popular" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"}`}
        >
          Popular
        </button>
      </div>

      {/* Comments list */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading comments...
          </div>
        ) : comments.filter(c => !c.parent_comment_id).length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {getSortedComments().map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseComments;
