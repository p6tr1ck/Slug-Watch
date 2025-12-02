import { Marker, Popup } from "react-leaflet";
import { useState, useRef, useEffect } from "react";
import makeIcon from "./MakeIcon";
import MarkerWithPopup from "./MarkerWithPopup";
import { delInSupa } from "../supaPins.js";
import CommentsPopup from "./CommentsPopup";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

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
  const [expanded, setExpanded] = useState(false);
  const [editClicked, setEditClicked] = useState(false);
  const markerRef = useRef(null);

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
  const [showComments, setShowComments] = useState(false);

  const directionsUrl = () => {
    return m.lat && m.long
      ? `https://www.google.com/maps?q=${m.lat},${m.long}`
      : `https://www.google.com/maps`;
  };

  const shortText = (t, n = 140) =>
    t && t.length > n ? t.slice(0, n) + "…" : t;

  async function onDelete() {
    handleClose();
    try {
      await delInSupa({ id: m.id });
      markerRef.current?.closePopup();
    } catch (e) {
      console.error("Error deleting pin: ", e);
    }
  }

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
              <div className="px-3 pt-3">
                <div className="flex items-center justify-between gap-2 ">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${categoryChip(
                      m.category
                    )}`}
                    title={m.category}
                  >
                    {m.category}
                  </span>
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
              <h3 className="px-3 pt-3 pb-2 text-base font-semibold text-slate-900 leading-tight">
                {m.title || "Incident"}
              </h3>
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

              {/* Footer actions */}
              <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-2">
                <a
                  href={directionsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm hover:bg-slate-50 transition"
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
                      className="p-2 bg-blue-600 text-white rounded-full shadow cursor-pointer hover:bg-sky-700"
                      onClick={() => setShowComments((s) => !s)}
                    >
                      💬 Comments
                    </button>
                  )}
              </div>

              {/* Comments section */}
              {showComments && (
                <div className="px-3 pb-3">
                  <CommentsPopup
                    pinId={m.id}
                    onClose={() => setShowComments(false)}
                    canModify={canModify}
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
