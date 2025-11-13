import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import makeIcon from "./MakeIcon";
import { ReportPost } from "./reportPopup.jsx"

export default function MarkerWithPopup({
  m,
  updateMarker,
  removeMarker,
  canModify,
  onReport,
  currUserID
}) {
  const markerRef = useRef(null);
  const categories = ["TAPS", "ICE", "Suspicious Activity", "Theft", "Other"];

  const [form, setForm] = useState({
    title: m.title || "",
    address: m.address || "",
    datetime: m.datetime || "",
    category: m.category || categories[0],
    description: m.description || "",
  });

  const [showReport, setShowReport] = useState()

  useEffect(() => {
    // keep local form in sync when parent marker changes
    setForm({
      title: m.title || "",
      address: m.address || "",
      datetime: m.datetime || "",
      category: m.category || categories[0],
      description: m.description || "",
    });
    setShowReport(false);
  }, [m.id]);

  useEffect(() => {
    // open the popup automatically for newly created markers
    if (m.isNew && markerRef.current) {
      try {
        markerRef.current.openPopup();
      } catch (e) {
        console.error("Error opening popup: ", e);
      }
    }
  }, [m.isNew]);

  function handleReportSub(data){
    if (onReport) onReport(data);
    else console.log("Report sent: ", data);
    setShowReport(false);
  }

  const allFilled =
    form.title.trim() &&
    form.address.trim() &&
    form.datetime &&
    form.category &&
    form.description.trim();
  const disabled = !canModify;

  function onSave() {
    if (disabled || !allFilled) return;
    updateMarker(m.id, { ...form, isNew: false });
    try {
      markerRef.current.closePopup();
    } catch (e) {
      console.error("Error saving pin: ", e);
    }
  }

  function onDelete() {
    if (disabled) return;
    removeMarker(m.id);
    try {
      markerRef.current.closePopup();
    } catch (e) {
      console.error("Error deleting pin: ", e);
    }
  }

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <Marker ref={markerRef} position={m.position} icon={makeIcon(m.className)}>
      <Popup>
        <div className="w-72" onClick={stop} onMouseDown={stop}>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="w-full border p-1 rounded mb-2"
            value={form.title}
            disabled={disabled}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />

          <label className="block text-sm font-medium">Address</label>
          <input
            className="w-full border p-1 rounded mb-2"
            value={form.address}
            disabled={disabled}
            onChange={(e) =>
              setForm((s) => ({ ...s, address: e.target.value }))
            }
          />

          <label className="block text-sm font-medium">Date & Time</label>
          <input
            type="datetime-local"
            className="w-full border p-1 rounded mb-2"
            value={form.datetime}
            disabled={disabled}
            onChange={(e) =>
              setForm((s) => ({ ...s, datetime: e.target.value }))
            }
          />

          <label className="block text-sm font-medium">Category</label>
          <select
            className="w-full border p-1 rounded mb-2"
            value={form.category}
            disabled={disabled}
            onChange={(e) =>
              setForm((s) => ({ ...s, category: e.target.value }))
            }
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="w-full border p-1 rounded mb-2"
            rows={3}
            value={form.description}
            disabled={disabled}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
          />

          {canModify ? (
            <div className="flex justify-between">
              <button
                className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={onSave}
                disabled={!allFilled}
              >
                Save
              </button>
              <button
                className="px-2 py-1 bg-red-600 text-white rounded"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center">
              You can only edit your own pins.
            </div>
          )}
           <button
            className="mt-2 px-2 py-1 rounded border"
            onClick={() => setShowReport((v) => !v)}>
            {showReport ? "Close report" : "Report"}
          </button>
          {showReport && (
            <div className="mt-2">
              <ReportPost
                pinId={m.id}
                userId={currUserID}
                onSubmit={handleReportSub}
                onCancel={() => setShowReport(false)}/>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );

}
