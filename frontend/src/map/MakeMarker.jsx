import { Marker, Popup } from "react-leaflet";
import { useState } from "react";
import makeIcon from "./MakeIcon";
import { ReportPost } from "./reportPopup";


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
  pId,
  title,
  category,
  description,
  time,
  position, // [lat, lng]
  currUserID,
  onReport,
  canReport = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const directionsUrl = () => {
    const [lat, lng] = position || [];
    return lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.google.com/maps`;
  };

  const shortText = (t, n = 140) =>
    t && t.length > n ? t.slice(0, n) + "…" : t;

  function handleReportSub(ticket){
    if(onReport) onReport(ticket);
    else console.log("report ticket: ", ticket);
    setShowReport(false);
  }

  const showReportCtrl = canReport && !!onReport && !!currUserID;

  return (
    <Marker position={position} icon={makeIcon(category)}>
      <Popup>
        {/* Card */}
        <div className="min-w-[240px] max-w-[320px] bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                {title || "Incident"}
              </h3>

              {category && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${categoryChip(
                    category
                  )}`}
                  title={category}
                >
                  {category}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200" />

          {/* Body */}
          <div className="px-3 py-2 text-[15px] text-slate-700 leading-snug space-y-1.5">
            {time && (
              <div className="flex gap-2">
                <span className="font-medium text-slate-900">Time:</span>
                <span>{time}</span>
              </div>
            )}

            {description && (
              <div>
                <span className="font-medium text-slate-900">Description:</span>{" "}
                <span className="text-slate-700">
                  {expanded ? description : shortText(description)}
                </span>
                {description.length > 140 && (
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
            {/* button opposite of directions, red outline,leads to report popup*/}
            {showReportCtrl && (
              <button
                type = "button"
                className="inline-flex-items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-sm test-rose-700 hover:bg-rose-50 transition"
                onClick={() => setShowReport((v)=>!v)}
                > 
                {showReport ? "Close" : "Report Post"}
              </button>
            )}
          </div>
          {showReportCtrl && showReport && (
            <div className="px-3 pb-3">
              <ReportPost
                pID={pId}
                uID={currUserID}
                onSub={handleReportSub}
                onCancel={() => setShowReport(false)}
              />
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
