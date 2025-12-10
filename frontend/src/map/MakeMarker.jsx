import { Marker, Popup, useMap } from "react-leaflet";
import { useState, useRef, useEffect, useContext, useCallback } from "react";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import makeIcon from "./MakeIcon";
import CommentsPopup from "./CommentsPopup";
import { ReportPost } from "./reportPopup";
import MarkerWithPopup from "./MarkerWithPopup";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { delInSupa } from "../supaPins.js";
import { supabase } from "../../supabaseClient.js";
import { AuthContext, DarkModeSwitch } from "../App";
import { send_report_db } from "../sbReportHandle";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import FlagIcon from "@mui/icons-material/Flag";
import { darkModeSwitch } from "../dashboard/Darkmode.jsx";

// Top left chip for the pin that described the category of the pin
const categoryChip = (category = "") => {
  // Applies Tailwind color classes depending on pin category
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
  currUserID,
  onReport,
  canReport = false, // allow reporting of the pin
  canModify = false, // allow editing/deleting
  isBookmarked = false, // bookmarked state
  onBookmarkToggle, // toggle bookmark action
}) {
  const { session } = useContext(AuthContext);
  const [expanded, setExpanded] = useState(false);
  const { selectDashboardItem, setSelectDashboardItem } =
    useContext(AuthContext);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editClicked, setEditClicked] = useState(false);
  // Voting state
  const [voteState, setVoteState] = useState({
    upvotes: Number(m.upvotes ?? 0),
    downvotes: Number(m.downvotes ?? 0),
    myVote: Number(m.myVote ?? 0),
  });
  const [votesLoading, setVotesLoading] = useState(false);
  const { theme } = useContext(DarkModeSwitch);
  const markerRef = useRef(null);
  const map = useMap();
  const isCertified = Boolean(m.certified);

  // Check if marker is in top portion of screen and flip popup accordingly
  const handlePopupOpen = useCallback(
    (e) => {
      if (!map) return;
      const point = map.latLngToContainerPoint([m.lat, m.long]);
      const mapHeight = map.getSize().y;
      const shouldFlip = point.y < mapHeight * 0.4;

      const popupEl = e.popup.getElement();
      if (popupEl) {
        // Always remove first to reset state
        popupEl.classList.remove("popup-flipped");

        if (shouldFlip) {
          popupEl.classList.add("popup-flipped");
          e.popup.options.autoPan = false;
        } else {
          e.popup.options.autoPan = true;
        }
      }
    },
    [map, m.lat, m.long]
  );

  // Open popup if selected from inbox
  useEffect(() => {
    if (selectedPinId && selectedPinId === m.id && markerRef.current) {
      markerRef.current.openPopup();
      setSelectedPinId(null);
    }
  }, [selectedPinId, m.id, setSelectedPinId]);

  // Refresh vote state when marker data changes
  useEffect(() => {
    setVoteState({
      upvotes: Number(m.upvotes ?? 0),
      downvotes: Number(m.downvotes ?? 0),
      myVote: Number(m.myVote ?? 0),
    });
  }, [m.id, m.upvotes, m.downvotes, m.myVote]);

  // Load votes from Supabase
  const fetchVotes = useCallback(async () => {
    // Skip fetching votes for certified/police pins (they have prefixed IDs that aren't valid UUIDs)
    if (isCertified || String(m.id).startsWith("police-")) {
      setVotesLoading(false);
      return;
    }

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

      if (
        session?.user?.id &&
        row.user_id === session.user.id &&
        myVote === 0
      ) {
        if (
          session?.user?.id &&
          row.user_id === session.user.id &&
          myVote === 0
        ) {
          myVote = val;
        }
      }
    });

    setVoteState({ upvotes, downvotes, myVote });
    setVotesLoading(false);
  }, [m.id, session?.user?.id, isCertified]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  // Build Google Maps directions link
  const directionsUrl = () => {
    return m.lat && m.long
      ? `https://www.google.com/maps?q=${m.lat},${m.long}`
      : `https://www.google.com/maps`;
  };

  // Truncate long text
  const shortText = (t, n = 140) =>
    t && t.length > n ? t.slice(0, n) + "..." : t;

  // Delete pin in Supabase
  async function onDelete() {
    handleClose();
    try {
      await delInSupa({ id: m.id });
      markerRef.current?.closePopup();
    } catch (e) {
      console.error("Error deleting pin: ", e);
    }
  }

  // Menu state for edit/delete button
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleClose();
    setEditClicked(!editClicked);
  };

  // Upvote/downvote handler
  const onVote = async (direction) => {
    if (!session?.user?.id) return;
    setVotesLoading(true);

    try {
      if (voteState.myVote === direction) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("pin_id", m.id)
          .eq("user_id", session.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("votes").upsert(
          {
            pin_id: m.id,
            user_id: session.user.id,
            value: direction,
          },
          { onConflict: "pin_id,user_id" }
        );
        if (error) throw error;
      }
    } catch (err) {
      console.error("Failed to persist vote", err);
    } finally {
      await fetchVotes();
    }
  };

  // Submit report
  async function handleReportSub(ticket) {
    try {
      const reporterId = session?.user?.id ?? currUserID;
      if (!reporterId) {
        console.error("missing reporter_id for report", ticket);
        return;
      }
      const fixedTicket = { ...ticket, reporter_id: reporterId };
      if (onReport) {
        await onReport(fixedTicket);
      } else {
        await send_report_db(fixedTicket);
      }
    } catch (err) {
      console.error("heres an insert report err: ", err);
    } finally {
      setShowReport(false);
    }
  }

  // Whether user is allowed to report a pin
  const showReportCtrl =
    (!!currUserID && m.user_id && m.user_id !== currUserID) || canReport;

  // Dashboard selects pin then open popup
  useEffect(() => {
    if (!markerRef.current) return;
    if (selectDashboardItem === null) {
      markerRef.current.closePopup();
      return;
    }

    if (selectDashboardItem === m.id.substr(7)) {
      markerRef.current.openPopup();
    }
  }, [selectDashboardItem]);

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
          eventHandlers={{
            popupopen: handlePopupOpen,
          }}
        >
          <Popup minWidth={320} maxWidth={400} autoPan={true}>
            <div
              className={`min-w-[240px] max-w-[320px] ${
                theme === "light" ? "bg-white" : "bg-neutral-800"
              } border border-slate-200 rounded-xl shadow-md overflow-hidden`}
            >
              <div className="px-3 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${categoryChip(
                      m.category
                    )}`}
                    title={m.category}
                  >
                    {m.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {showReportCtrl && (
                      <button
                        type="button"
                        className={`inline-flex-items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition cursor-pointer  ${
                          theme === "light"
                            ? "bg-white hover:bg-rose-50 text-rose-700"
                            : "bg-zinc-800 hover:bg-rose-700 text-rose-500"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowReport((v) => !v);
                        }}
                      >
                        <FlagIcon /> Report
                      </button>
                    )}
                  </div>
                  {canModify && (
                    <>
                      <Button
                        id="basic-button"
                        aria-controls={open ? "basic-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? "true" : undefined}
                        onClick={handleClick}
                        sx={{
                          minWidth: "unset",
                          padding: "2px 6px", // smaller padding
                          fontSize: "0.75rem", // smaller text
                        }}
                      >
                        ...
                      </Button>
                      <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{
                          list: {
                            "aria-labelledby": "basic-button",
                          },
                        }}
                      >
                        <MenuItem
                          sx={{ padding: "4px 12px", fontSize: "0.8rem" }}
                          onClick={handleEdit}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          sx={{ padding: "4px 12px", fontSize: "0.8rem" }}
                          onClick={onDelete}
                        >
                          Delete
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </div>
              </div>
              <h3
                className={`px-3 pt-3 pb-2 text-base font-semibold ${
                  theme === "light" ? "text-slate-900" : "text-white"
                } leading-tight`}
              >
                {m.title || "Incident"}
              </h3>
              {/* Divider */}
              <div className="h-px bg-slate-200" />

              <div className="px-3 py-2 text-[15px] text-slate-700 leading-snug space-y-1.5">
                {m.created_at && (
                  <div className="flex gap-2">
                    <span
                      className={`font-medium ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}
                    >
                      Time:
                    </span>
                    <span
                      className={`${
                        theme === "light" ? "text-slate-700" : "text-stone-300"
                      }`}
                    >
                      {m.created_at}
                    </span>
                  </div>
                )}

                {m.description && (
                  <div>
                    <span
                      className={`font-medium  ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}
                    >
                      Description:
                    </span>{" "}
                    <span
                      className={`${
                        theme === "light" ? "text-slate-700" : "text-stone-300"
                      }`}
                    >
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
                <div
                  className={`px-3 pb-2 pt-2 border-t border-slate-200 ${
                    theme === "light" ? "bg-slate-50/70" : "bg-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm text-slate-800 mb-2">
                    <span
                      className={`font-medium ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}
                    >
                      Community votes
                    </span>
                    <span
                      className={`text-xs ${
                        theme === "light" ? "text-slate-500" : "text-stone-300"
                      }`}
                    >
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
                      <ThumbUpIcon fontSize="small" />
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
                      <ThumbDownIcon fontSize="small" />
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-800 ring-1 ring-slate-200">
                        {voteState.downvotes}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-2">
                <a
                  href={directionsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                    theme === "light"
                      ? "border-slate-300 bg-white hover:bg-slate-50 text-cyan-900"
                      : "border-slate-300 bg-zinc-800 hover:bg-slate-700 text-cyan-200"
                  }`}
                >
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

                {/* Show comments button for non-verified pins */}
                {m.category &&
                  !m.category.toLowerCase().includes("verified") && (
                    <button
                      title="Comments"
                      className={`px-2.5 py-1.5 border rounded-lg shadow cursor-pointer text-sm flex ${
                        theme === "light"
                          ? "border-gray-300 bg-white hover:bg-gray-100 text-black"
                          : "border-gray-300 bg-zinc-800 hover:bg-gray-700 text-white"
                      }`}
                      onClick={() => setShowComments((s) => !s)}
                    >
                      <div className="mr-2">💬</div>
                      Comments
                    </button>
                  )}

                {/* Bookmark button */}
                <button
                  title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                  className="px-2.5 py-1.5 bg-yellow-600 border border-gray-300 text-white rounded-lg shadow text-sm cursor-pointer hover:bg-yellow-500"
                  onClick={onBookmarkToggle}
                >
                  {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </button>
              </div>

              {/* Comments section */}
              {showComments && (
                <div className="px-3 pb-3">
                  <CommentsPopup
                    pinId={m.id}
                    pinAuthor={m.user_id}
                    onClose={() => setShowComments(false)}
                  />
                </div>
              )}

              {showReportCtrl && showReport && (
                <div className="px-3 pb-3">
                  <ReportPost
                    pID={m.id}
                    uID={currUserID}
                    onSub={handleReportSub}
                    onCancel={() => setShowReport(false)}
                  />
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}
