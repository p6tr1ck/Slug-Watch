import { useContext, useEffect, useMemo, useState } from "react";
import { getUserID } from "../supaPins.js";
import { fetchComments, addComment as addCommentToSupa, toggleVote as toggleVoteInSupa } from "../supaComments.js";
import { AuthContext } from "../App";

export default function CommentsPopup({ pinId, onClose }) {
  const { session } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get display name from session
  const displayName = session?.user?.user_metadata?.full_name 
    || session?.user?.user_metadata?.name 
    || session?.user?.user_metadata?.preferred_username 
    || "UCSC Member";

  // Load comments from Supabase
  useEffect(() => {
    let mounted = true;
    
    async function loadComments() {
      try {
        setLoading(true);
        const data = await fetchComments(pinId);
        if (mounted) {
          setComments(data);
        }
      } catch (e) {
        console.error("Failed to load comments", e);
        if (mounted) setComments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadComments();

    return () => {
      mounted = false;
    };
  }, [pinId]);

  // Get current user
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const uid = await getUserID();
        if (mounted && uid) {
          setCurrentUser(uid);
        }
      } catch (e) {
        console.warn("Could not get supabase user", e);
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function addComment() {
    if (!text.trim()) return;
    if (!currentUser) {
      alert("Please sign in to comment");
      return;
    }

    try {
      const newComment = await addCommentToSupa({
        pinId,
        parentId: replyTo,
        text: text.trim(),
      });
      
      setComments((s) => [newComment, ...s]);
      setText("");
      setReplyTo(null);
    } catch (e) {
      console.error("Failed to add comment:", e);
      alert(e.message || "Failed to add comment");
    }
  }

  async function toggleVote(id, value) {
    if (!currentUser) {
      alert("Please sign in to vote");
      return;
    }

    try {
      await toggleVoteInSupa({ commentId: id, vote: value });
      
      // Update local state optimistically
      setComments((s) =>
        s.map((c) => {
          if (c.id !== id) return c;
          const votes = { ...(c.votes || {}) };
          const prev = votes[currentUser] || 0;
          if (prev === value) {
            delete votes[currentUser];
          } else {
            votes[currentUser] = value;
          }
          return { ...c, votes };
        })
      );
    } catch (e) {
      console.error("Failed to toggle vote:", e);
      alert(e.message || "Failed to vote");
    }
  }

  function startReply(id) {
    setReplyTo(id);
    const el = document.getElementById(`comment-input-${pinId}`);
    if (el) el.focus();
  }

  // derive threaded tree and sort siblings by likes desc then date
  const tree = useMemo(() => {
    const map = {};
    comments.forEach((c) => (map[c.id] = { ...c, children: [] }));
    const roots = [];
    Object.values(map).forEach((c) => {
      if (c.parentId && map[c.parentId]) map[c.parentId].children.push(c);
      else roots.push(c);
    });

    function scoreOf(n) {
      return Object.values(n.votes || {}).reduce((s, v) => s + v, 0);
    }

    function sortNode(node) {
      node.children.sort((a, b) => scoreOf(b) - scoreOf(a) || new Date(b.createdAt) - new Date(a.createdAt));
      node.children.forEach(sortNode);
    }

    roots.sort((a, b) => scoreOf(b) - scoreOf(a) || new Date(b.createdAt) - new Date(a.createdAt));
    roots.forEach(sortNode);
    return roots;
  }, [comments]);

  return (
    <div className="p-1.5 bg-white rounded shadow w-64 max-h-56 flex flex-col border text-xs">
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <strong className="text-xs">Comments</strong>
        <div className="flex items-center gap-1.5">
          {replyTo ? (
            <button
              className="text-xs text-gray-500"
              onClick={() => setReplyTo(null)}
              title="Cancel reply"
            >
              cancel
            </button>
          ) : null}
          <button
            className="px-1.5 py-0.5 text-xs bg-gray-200 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {!replyTo && (
        <div className="mb-1 flex-shrink-0">
          <textarea
            id={`comment-input-${pinId}`}
            rows={2}
            className="w-full border p-0.5 rounded text-xs resize-none"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-between mt-0.5 items-center">
            <div className="text-xs text-gray-500">Signed in as {displayName}</div>
            <button
              className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs"
              onClick={addComment}
            >
              Post
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="text-xs text-gray-500 py-1">Loading comments...</div>
        ) : tree.length === 0 ? (
          <div className="text-xs text-gray-500 py-1">No comments yet.</div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <CommentNode
                key={node.id}
                node={node}
                onLike={toggleVote}
                onReply={startReply}
                currentUser={currentUser}
                depth={0}
                replyTo={replyTo}
                text={text}
                setText={setText}
                addComment={addComment}
                pinId={pinId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentNode({ node, onLike, onReply, depth, currentUser, replyTo, text, setText, addComment, pinId }) {
  // timeago helper
  function timeAgo(iso) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day > 0) return `${day} day${day > 1 ? "s" : ""} ago`;
    if (hr > 0) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
    if (min > 0) return `${min} minute${min > 1 ? "s" : ""} ago`;
    return `just now`;
  }

  return (
    <div className="pl-0.5" style={{ marginLeft: depth * 8 }}>
      <div className="border rounded p-1.5 bg-gray-50">
        <div className="flex justify-between items-start gap-1.5">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">{node.author}</div>
            <div className="text-xs text-gray-500">{timeAgo(node.createdAt)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center text-xs">
              <button
                className={`px-1 py-0 ${((node.votes||{})[currentUser]===1)? 'text-orange-600 font-bold' : 'text-gray-500'}`}
                onClick={() => onLike(node.id, 1)}
                title="Upvote"
              >
                ▲
              </button>
              <div className="text-xs font-medium leading-tight">{Object.values(node.votes||{}).reduce((s,v)=>s+v,0)}</div>
              <button
                className={`px-1 py-0 ${((node.votes||{})[currentUser]===-1)? 'text-blue-600 font-bold' : 'text-gray-500'}`}
                onClick={() => onLike(node.id, -1)}
                title="Downvote"
              >
                ▼
              </button>
            </div>
            <div>
              <button
                className="px-1.5 py-0.5 text-xs text-blue-600"
                onClick={() => onReply(node.id)}
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        <div className="mt-1 text-xs whitespace-pre-wrap break-words">{node.text}</div>
        
        {replyTo === node.id && (
          <div className="mt-1">
            <textarea
              id={`reply-input-${node.id}`}
              rows={2}
              className="w-full border p-0.5 rounded text-xs resize-none"
              placeholder="Reply to comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-1 mt-0.5">
              <button
                className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                onClick={() => onReply(null)}
              >
                Cancel
              </button>
              <button
                className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs"
                onClick={addComment}
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((ch) => (
            <CommentNode 
              key={ch.id} 
              node={ch} 
              onLike={onLike} 
              onReply={onReply} 
              depth={depth + 1} 
              currentUser={currentUser}
              replyTo={replyTo}
              text={text}
              setText={setText}
              addComment={addComment}
              pinId={pinId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
