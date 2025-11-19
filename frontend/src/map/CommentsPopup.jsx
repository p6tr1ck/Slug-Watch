import { useEffect, useMemo, useState } from "react";
import { getUserID } from "../supaPins.js";

// Simple threaded comments widget stored in localStorage per-pin.
// Comment shape: { id, pinId, parentId|null, author, text, createdAt, likes }

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function storageKey(pinId) {
  return `slugwatch_comments_${pinId}`;
}

export default function CommentsPopup({ pinId, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ensure a stable anonymous id when a user is not signed in
  function ensureAnonId() {
    const key = "slugwatch_anon_user";
    let a = localStorage.getItem(key);
    if (!a) {
      a = `anon_${uid()}`;
      localStorage.setItem(key, a);
    }
    return a;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(pinId));
      const parsed = raw ? JSON.parse(raw) : [];
      // normalize legacy shape: convert likedBy array to votes map, ensure createdAt
      const normalized = parsed.map((c) => {
        const createdAt = c.createdAt || new Date().toISOString();
        // migrate likedBy -> votes (likedBy items become +1)
        let votes = c.votes || {};
        if (Array.isArray(c.likedBy)) {
          votes = {};
          c.likedBy.forEach((u) => {
            votes[u] = 1;
          });
        }
        return { ...c, votes, createdAt };
      });
      setComments(normalized);
    } catch (e) {
      console.error("Failed to load comments", e);
      setComments([]);
    }
  }, [pinId]);

  useEffect(() => {
    // get authenticated user id if available, otherwise fallback to anon id
    let mounted = true;
    (async () => {
      try {
        const uid = await getUserID();
        if (!mounted) return;
        if (uid) setCurrentUser(uid);
        else setCurrentUser(ensureAnonId());
      } catch (e) {
        console.warn("Could not get supabase user, using anon id", e);
        if (mounted) setCurrentUser(ensureAnonId());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(pinId), JSON.stringify(comments));
    } catch (e) {
      console.error("Failed to save comments", e);
    }
  }, [comments, pinId]);

  function addComment() {
    if (!text.trim()) return;
    const c = {
      id: uid(),
      pinId,
      parentId: replyTo || null,
      author: "UCSC member",
      text: text.trim(),
      createdAt: new Date().toISOString(),
      votes: {},
    };
    setComments((s) => [c, ...s]);
    setText("");
    setReplyTo(null);
  }

  function toggleVote(id, value) {
    // value is 1 for upvote, -1 for downvote
    if (!currentUser) return;
    setComments((s) =>
      s.map((c) => {
        if (c.id !== id) return c;
        const votes = { ...(c.votes || {}) };
        const prev = votes[currentUser] || 0;
        if (prev === value) {
          // toggle off
          delete votes[currentUser];
        } else {
          votes[currentUser] = value;
        }
        return { ...c, votes };
      })
    );
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
    <div className="p-2 bg-white rounded shadow w-80 max-h-96 overflow-auto border">
      <div className="flex items-center justify-between mb-2">
        <strong>Comments</strong>
        <div className="flex items-center gap-2">
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
            className="px-2 py-1 text-sm bg-gray-200 rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <div className="mb-2">
        <textarea
          id={`comment-input-${pinId}`}
          rows={2}
          className="w-full border p-1 rounded"
          placeholder={replyTo ? "Reply to comment..." : "Add a comment..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-between mt-1">
          <div className="text-xs text-gray-500">Signed in as UCSC member</div>
          <button
            className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
            onClick={addComment}
          >
            Post
          </button>
        </div>
      </div>

      <div>
        {tree.length === 0 ? (
          <div className="text-sm text-gray-500">No comments yet.</div>
        ) : (
          <div className="space-y-2">
            {tree.map((c) => (
              <CommentNode
                key={c.id}
                node={c}
                onLike={toggleVote}
                onReply={startReply}
                currentUser={currentUser}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentNode({ node, onLike, onReply, depth, currentUser }) {
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
    <div className="pl-1" style={{ marginLeft: depth * 12 }}>
      <div className="border rounded p-2 bg-gray-50">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="text-sm font-medium">{node.author}</div>
            <div className="text-xs text-gray-500">{timeAgo(node.createdAt)}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center text-sm">
              <button
                className={`px-2 py-0.5 ${((node.votes||{})[currentUser]===1)? 'text-orange-600 font-bold' : 'text-gray-500'}`}
                onClick={() => onLike(node.id, 1)}
                title="Upvote"
              >
                ▲
              </button>
              <div className="text-xs font-medium">{Object.values(node.votes||{}).reduce((s,v)=>s+v,0)}</div>
              <button
                className={`px-2 py-0.5 ${((node.votes||{})[currentUser]===-1)? 'text-blue-600 font-bold' : 'text-gray-500'}`}
                onClick={() => onLike(node.id, -1)}
                title="Downvote"
              >
                ▼
              </button>
            </div>
            <div>
              <button
                className="px-2 py-0.5 text-xs text-blue-600"
                onClick={() => onReply(node.id)}
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 text-sm whitespace-pre-wrap">{node.text}</div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((ch) => (
            <CommentNode key={ch.id} node={ch} onLike={onLike} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
