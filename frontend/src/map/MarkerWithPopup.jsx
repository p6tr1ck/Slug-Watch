import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
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
  const categories = ["TAPS", "ICE", "Suspicious Activity", "Theft", "Other"];

  const [form, setForm] = useState({
    title: m.title || "",
    datetime: m.datetime || "",
    category: m.category || categories[0],
    description: m.description || "",
  });

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(m.isNew || false);
  const [showComments, setShowComments] = useState(false);

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
  const disabled = !editing;

  async function onSave() {
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
      setEditing(false);
    } catch (e) {
      console.error("Error saving pin: ", e);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    try {
      if (m.supabaseId) await delInSupa({ id: m.supabaseId });
      removeMarker(m.id);
      markerRef.current?.closePopup();
    } catch (e) {
      console.error("Error deleting pin: ", e);
      // show a simple alert so users get immediate feedback in the UI
      try {
        window.alert(`Failed to delete pin: ${e?.message || e}`);
      } catch (_) {}
    }
  }

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <Marker ref={markerRef} position={m.position} icon={makeIcon(m.className)}>
      <Popup autoPan={true} maxWidth={320}>
        <div className="w-72 max-h-[60vh] overflow-auto" onClick={stop} onMouseDown={stop}>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="w-full border p-1 rounded mb-2"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />

          <label className="block text-sm font-medium">Date & Time</label>
          <input
            type="datetime-local"
            className="w-full border p-1 rounded mb-2"
            value={form.datetime}
            onChange={(e) =>
              setForm((s) => ({ ...s, datetime: e.target.value }))
            }
          />

          <label className="block text-sm font-medium">Category</label>
          <select
            className="w-full border p-1 rounded mb-2"
            value={form.category}
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
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
          />
        </div>
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

          {canModify ? (
            <div className="flex justify-between items-center">
              {editing ? (
                <div className="flex gap-2">
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
                <button
                  className="px-2 py-1 bg-blue-600 text-white rounded"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center">
              You can only edit your own pins.
            </div>
          )}

          {/* chat button and inline comments to avoid viewport overflow */}
          <div className="mt-2 flex justify-end">
            <button
              title="Comments"
              className="p-2 bg-blue-600 text-white rounded-full shadow"
              onClick={() => setShowComments((s) => !s)}
            >
              💬
            </button>
          </div>

          {showComments && (
            <div className="mt-2">
              <CommentsPopup pinId={m.supabaseId || `local:${m.position[0]},${m.position[1]}`} onClose={() => setShowComments(false)} />
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
