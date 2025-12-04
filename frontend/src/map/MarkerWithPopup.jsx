import { useEffect, useRef, useState, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import makeIcon from "./MakeIcon";
import { insToSupa, delInSupa, editToSupa } from "../supaPins.js";
import CommentsPopup from "./CommentsPopup";

function toDatetimeLocal(ts) {
  if (!ts) return "";

  const date = new Date(ts);

  const pad = (n) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function MarkerWithPopup({
  m,
  removeMarker,
  setMarkers,
  editClicked = false,
  setEditClicked,
  canModify = true,
}) {
  const markerRef = useRef(null);
  const map = useMap();
  const categories = ["TAPS", "ICE", "Suspicious Activity", "Theft", "Other"];

  // Check if marker is in top portion of screen and flip popup accordingly
  const handlePopupOpen = useCallback((e) => {
    if (!map || !m.position) return;
    const point = map.latLngToContainerPoint(m.position);
    const mapHeight = map.getSize().y;
    const shouldFlip = point.y < mapHeight * 0.4;
    
    const popupEl = e.popup.getElement();
    if (popupEl) {
      // Always remove first to reset state
      popupEl.classList.remove('popup-flipped');
      
      if (shouldFlip) {
        popupEl.classList.add('popup-flipped');
        e.popup.options.autoPan = false;
      } else {
        e.popup.options.autoPan = true;
      }
    }
  }, [map, m.position]);

  const [form, setForm] = useState({
    title: m.title || "",
    datetime: m.datetime || "",
    category: m.category || categories[0],
    description: m.description || "",
  });

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(m.isNew || false);
  const [showComments, setShowComments] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    // keep local form in sync when parent marker changes
    setForm({
      title: m.title || "",
      datetime: m.datetime || "",
      category: m.category || categories[0],
      description: m.description || "",
    });
    // if a new marker is passed in, start in editing mode
    setEditing(m.isNew || false);
    setTouched({});
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

  // Open the popup when edit is clicked
  useEffect(() => {
    if (!editClicked) return;

    const t = setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 0);

    return () => clearTimeout(t);
  }, [editClicked]);

  // Change the datetime field as the pin's created at time
  useEffect(() => {
    setForm((prev) => ({ ...prev, datetime: toDatetimeLocal(m.created_at) }));
  }, [editClicked]);

  const allFilled =
    form.title.trim() &&
    form.datetime &&
    form.category &&
    form.description.trim();

  const getFieldError = (field) => {
    if (!touched[field]) return null;
    if (field === "title" && !form.title.trim()) return "Title is required";
    if (field === "datetime" && !form.datetime) return "Date & time is required";
    if (field === "description" && !form.description.trim()) return "Description is required";
    return null;
  };

  async function onSave() {
    // Mark all fields as touched to show validation
    setTouched({ title: true, datetime: true, description: true });
    
    if (!allFilled) return;
    setSaving(true);
    try {
      let row;
      if (editClicked && m.id) {
        row = await editToSupa({ id: m.id, form, m });
      } else {
        row = await insToSupa({ form, m });
      }
      markerRef.current?.closePopup();
      
      // Delete the local marker in the application
      // because realtime pulling of pins will reflect on the map
      if (!editClicked) {
        setMarkers([]);
      } else {
        // Remove the input fields when edit is saved
        setEditClicked(false);
      }
    } catch (e) {
      console.error("Error saving pin: ", e);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    try {
      if (m.supabaseId) await delInSupa({ id: m.supabaseId });
      removeMarker?.(m.id);
      markerRef.current?.closePopup();
      if (setEditClicked) setEditClicked(false);
    } catch (e) {
      console.error("Error deleting pin: ", e);
      try {
        window.alert(`Failed to delete pin: ${e?.message || e}`);
      } catch (_) {}
    }
  }

  function onCancel() {
    if (m.isNew) {
      removeMarker?.(m.id);
    }
    markerRef.current?.closePopup();
    if (setEditClicked) setEditClicked(false);
  }

  function stop(e) {
    e.stopPropagation();
  }

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      getFieldError(field)
        ? "border-red-300 bg-red-50"
        : "border-slate-300 bg-white hover:border-slate-400"
    }`;

  return (
    <Marker 
      ref={markerRef} 
      position={m.position} 
      icon={makeIcon(m.className)}
      eventHandlers={{
        popupopen: handlePopupOpen,
      }}
    >
      <Popup 
        autoPan={true} 
        minWidth={320} 
        maxWidth={360}
      >
        <div className="min-w-[300px] bg-white" onClick={stop} onMouseDown={stop}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {m.isNew ? "Create New Pin" : "Edit Pin"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {m.isNew ? "Fill in the details below" : "Update pin information"}
            </p>
          </div>

          {/* Form */}
          <div className="px-4 py-3 space-y-3">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass("title")}
                placeholder="Enter a title..."
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
              />
              {getFieldError("title") && (
                <p className="text-xs text-red-500 mt-1">{getFieldError("title")}</p>
              )}
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className={inputClass("datetime")}
                value={form.datetime}
                onChange={(e) => setForm((s) => ({ ...s, datetime: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, datetime: true }))}
              />
              {getFieldError("datetime") && (
                <p className="text-xs text-red-500 mt-1">{getFieldError("datetime")}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className={inputClass("description")}
                rows={3}
                placeholder="Describe what happened..."
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, description: true }))}
              />
              {getFieldError("description") && (
                <p className="text-xs text-red-500 mt-1">{getFieldError("description")}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            {canModify ? (
              <div className="flex items-center gap-2">
                <button
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    allFilled
                      ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                  onClick={onSave}
                  disabled={!allFilled || saving}
                >
                  {saving ? "Saving..." : "Save Pin"}
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                {!m.isNew && (
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                    onClick={onDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-2">
                You can only edit your own pins.
              </div>
            )}

            {/* Comments - only show for existing pins */}
            {!m.isNew && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <button
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  onClick={() => setShowComments((s) => !s)}
                >
                  💬 {showComments ? "Hide Comments" : "View Comments"}
                </button>
              </div>
            )}
          </div>

          {showComments && (
            <div className="px-4 pb-4">
              <CommentsPopup 
                pinId={m.supabaseId || `local:${m.position[0]},${m.position[1]}`} 
                onClose={() => setShowComments(false)} 
              />
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}