import { Marker, Popup } from "react-leaflet";
import {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import makeIcon from "./MakeIcon";
import MarkerWithPopup from "./MarkerWithPopup";
import { delInSupa } from "../supaPins.js";
import { supabase } from "../../supabaseClient.js";
import { AuthContext } from "../App";

const categoryChip = (category = "") => {
  const c = category.toLowerCase();
  if (c.includes("theft")) return "bg-amber-100 text-amber-800 ring-amber-200";
  if (c.includes("suspicious"))
    return "bg-indigo-100 text-indigo-800 ring-indigo-200";
  if (c.includes("verified")) return "bg-sky-100 text-sky-800 ring-sky-200";
  if (c.includes("taps"))
    return "bg-orange-100 text-orange-800 ring-orange-200";
  if (c.includes("ice")) return "bg-red-100 text-red-800 ring-red-200";
  return "bg-slate-100 text-slate-800 ring-slate-200";
};

export default function MakeMarker({
  m,
  setSelectedPinId,
  selectedPinId,
  canModify = false,
}) {
  const { session } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const [editClicked, setEditClicked] = useState(false);
  const [voteState, setVoteState] = useState({
    upvotes: Number(m.upvotes ?? 0),
    downvotes: Number(m.downvotes ?? 0),
    myVote: Number(m.myVote ?? 0),
  });
  const [votesLoading, setVotesLoading] = useState(false);
  const markerRef = useRef(null);
  const isCertified = Boolean(m.certified);

  // User clicked on a notification, make the pin popup on the map
  useEffect(() => {
    // If the current pin ID is == the selected notification, then
    // make the pin popup
    if (selectedPinId && selectedPinId === m.id && markerRef.current) {
      markerRef.current.openPopup();
      // Reset the state of selectedPinId, so value does not persist
      setSelectedPinId(null);
    }
  }, [selectedPinId, m.id]);

  useEffect(() => {
    setVoteState({
      upvotes: Number(m.upvotes ?? 0),
      downvotes: Number(m.downvotes ?? 0),
      myVote: Number(m.myVote ?? 0),
    });
  }, [m.id, m.upvotes, m.downvotes, m.myVote]);

  const fetchVotes = useCallback(async () => {
    setVotesLoading(true);
    const { data, error } = await supabase
      .from("votes")
      .select("pin_id, user_id, value, created_at")
      .eq("pin_id", m.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load votes", error);
      setVotesLoading(false);
      return;
    }

    let upvotes = 0;
    let downvotes = 0;
    let myVote = 0;

    data?.forEach((row) => {
      const val = Number(row.value);
      if (val === 1) upvotes += 1;
      else if (val === -1) downvotes += 1;

      if (!myVote && session?.user?.id && row.user_id === session.user.id) {
        myVote = val;
      }
    });

    setVoteState({ upvotes, downvotes, myVote });
    setVotesLoading(false);
  }, [m.id, session?.user?.id]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const directionsUrl = () => {
    return m.lat && m.long
      ? `https://www.google.com/maps?q=${m.lat},${m.long}`
      : `https://www.google.com/maps`;
  };

  const shortText = (t, n = 140) =>
    t && t.length > n ? t.slice(0, n) + "..." : t;

  async function onDelete() {
    try {
      await delInSupa({ id: m.id });
      markerRef.current?.closePopup();
    } catch (e) {
      console.error("Error deleting pin: ", e);
    }
  }

  const onVote = async (direction) => {
    if (!session?.user?.id) return;
    setVotesLoading(true);

    try {
      const { error } = await supabase
        .from("votes")
        .insert({
          pin_id: m.id,
          user_id: session.user.id,
          value: direction,
        });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to persist vote", err);
    } finally {
      await fetchVotes();
    }
  };

  return (
    <>
      {editClicked ? (
        <MarkerWithPopup
          m={m}
          editClicked={editClicked}
          setEditClicked={setEditClicked}
        />
      ) : (
        <Marker
          ref={markerRef}
          position={[m.lat, m.long]}
          icon={makeIcon(m.category)}
        >
          <Popup>
            {/* Card */}
            <div className="min-w-[240px] max-w-[320px] bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
              {/* Header */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 leading-tight">
                    {m.title || "Incident"}
                  </h3>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${categoryChip(
                      m.category
                    )}`}
                    title={m.category}
                  >
                    {m.category}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-200" />

              {/* Body */}
              <div className="px-3 py-2 text-[15px] text-slate-700 leading-snug space-y-1.5">
                {m.created_at && (
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-900">Time:</span>
                    <span>{m.created_at}</span>
                  </div>
                )}

                {m.description && (
                  <div>
                    <span className="font-medium text-slate-900">
                      Description:
                    </span>{" "}
                    <span className="text-slate-700">
                      {expanded ? m.description : shortText(m.description)}
                    </span>
                    {m.description.length > 140 && (
                      <button
                        onClick={() => setExpanded((v) => !v)}
                        className="ml-1 text-slate-600 underline underline-offset-2 hover:text-slate-900"
                      >
                        {expanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!isCertified && (
                <div className="px-3 pb-2 pt-2 border-t border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-between text-sm text-slate-800 mb-2">
                    <span className="font-medium text-slate-900">
                      Community votes
                    </span>
                    <span className="text-xs text-slate-500">
                      Share if this feels accurate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onVote(1)}
                      disabled={votesLoading || !session?.user?.id}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        voteState.myVote === 1
                          ? "border-green-200 bg-green-50 text-green-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M14.5 3.75c0-.966-.784-1.75-1.75-1.75c-.638 0-1.183.34-1.49.852L8.35 6.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h10.379a2.75 2.75 0 0 0 2.707-2.301l1.12-6.718a1.75 1.75 0 0 0-1.727-2.03H14.5Zm-8 3.75h2.45a1 1 0 0 0 .861-.489L12.06 3.9c.143-.24.413-.4.689-.4c.413 0 .75.336.75.75V9.5a1 1 0 0 0 1 1h2.979a.25.25 0 0 1 .246.29l-1.12 6.718a1.25 1.25 0 0 1-1.23 1.042H4.5v-11Z"
                        />
                      </svg>
                      <span>Thumbs up</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-800 ring-1 ring-slate-200">
                        {voteState.upvotes}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onVote(-1)}
                      disabled={votesLoading || !session?.user?.id}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        voteState.myVote === -1
                          ? "border-red-200 bg-red-50 text-red-800 shadow-sm"
                          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M9.5 20.25c0 .966.784 1.75 1.75 1.75c.638 0 1.183-.34 1.49-.852l2.91-4.648H20a1 1 0 0 0 1-1V4.5a1 1 0 0 0-1-1H9.621a2.75 2.75 0 0 0-2.707 2.3l-1.12 6.719a1.75 1.75 0 0 0 1.727 2.03H9.5Zm8-3.75H15.05a1 1 0 0 0-.861.489L11.94 20.1a.8.8 0 0 1-.689.4a.75.75 0 0 1-.75-.75V14.5a1 1 0 0 0-1-1H6.522a.25.25 0 0 1-.246-.29l1.12-6.718A1.25 1.25 0 0 1 8.626 5.45H20v11.05Z"
                        />
                      </svg>
                      <span>Thumbs down</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-800 ring-1 ring-slate-200">
                        {voteState.downvotes}
                      </span>
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Votes refresh directly from Supabase after each action.
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-2">
                <a
                  href={directionsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50 transition"
                >
                  {/* Simple options */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="opacity-80"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5Z"
                    />
                  </svg>
                  Directions
                </a>
                {canModify && (
                  <div className="flex items-center gap-1.5">
                    <button
                      className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-800 active:bg-green-900 transition disabled:opacity-50"
                      onClick={() => setEditClicked(!editClicked)}
                    >
                      <span>Edit</span>
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 hover:border-red-300 active:bg-red-200 transition"
                      onClick={onDelete}
                    >
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
