import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// --- Example pin data ---
function makeIcon(className) {
  return new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    className,
  });
}

const position1 = [36.98946, -122.06124];
const position2 = [36.99456, -122.05432];

const bounds = [
  [36.972521, -122.071543], // southwest corner
  [37.003957, -122.045296], // northeast corner
];

function MarkerWithPopup({ m, updateMarker, removeMarker }) {
  const markerRef = React.useRef(null);
  const categories = ["TAPS", "ICE", "Suspicious Activity", "Theft", "Other"];

  const [form, setForm] = React.useState({
    title: m.title || "",
    address: m.address || "",
    datetime: m.datetime || "",
    category: m.category || categories[0],
    description: m.description || "",
  });

  React.useEffect(() => {
    // keep local form in sync when parent marker changes
    setForm({
      title: m.title || "",
      address: m.address || "",
      datetime: m.datetime || "",
      category: m.category || categories[0],
      description: m.description || "",
    });
  }, [m.id]);

  React.useEffect(() => {
    // open the popup automatically for newly created markers
    if (m.isNew && markerRef.current) {
      try {
        markerRef.current.openPopup();
      } catch (e) {
        // ignore
      }
    }
  }, [m.isNew]);

  const allFilled = form.title.trim() && form.address.trim() && form.datetime && form.category && form.description.trim();

  function onSave() {
    if (!allFilled) return;
    updateMarker(m.id, { ...form, isNew: false });
    try {
      markerRef.current.closePopup();
    } catch (e) {}
  }

  function onDelete() {
    removeMarker(m.id);
    try {
      markerRef.current.closePopup();
    } catch (e) {}
  }

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <Marker ref={markerRef} position={m.position} icon={makeIcon(m.className)}>
      <Popup>
        <div className="w-72" onClick={stop} onMouseDown={stop}>
          <label className="block text-sm font-medium">Title</label>
          <input className="w-full border p-1 rounded mb-2" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />

          <label className="block text-sm font-medium">Address</label>
          <input className="w-full border p-1 rounded mb-2" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />

          <label className="block text-sm font-medium">Date & Time</label>
          <input type="datetime-local" className="w-full border p-1 rounded mb-2" value={form.datetime} onChange={(e) => setForm((s) => ({ ...s, datetime: e.target.value }))} />

          <label className="block text-sm font-medium">Category</label>
          <select className="w-full border p-1 rounded mb-2" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="block text-sm font-medium">Description</label>
          <textarea className="w-full border p-1 rounded mb-2" rows={3} value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />

          <div className="flex justify-between">
            <button
              className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              onClick={onSave}
              disabled={!allFilled}
            >
              Save
            </button>
            <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={onDelete}>Delete</button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}


export default function Map() {
  const [createMode, setCreateMode] = useState(false);
  const [markers, setMarkers] = useState([
    { id: 1, position: position1, title: "Custom colored marker", address: "", datetime: "", category: "TAPS", description: "Category: Example\nDetail: Example", className: "marker-blue" },
    { id: 2, position: position2, title: "Alert", address: "", datetime: "", category: "Theft", description: "Category: Safety\nDetail: Example red pin", className: "marker-red" },
  ]);

  function MapClickHandler({ createMode, onMapClick }) {
    useMapEvents({
      click(e) {
        if (!createMode) return;
        const { lat, lng } = e.latlng;
        onMapClick([lat, lng]);
      },
    });
    return null;
  }

  function handleMapClick(latlng) {
    const newMarker = { id: Date.now(), position: latlng, title: "", address: "", datetime: "", category: "TAPS", description: "", className: "marker-green", isNew: true };
    setMarkers((m) => [...m, newMarker]);
    setCreateMode(false);
  }

  function updateMarker(id, patch) {
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removeMarker(id) {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="relative h-full w-full">
      <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 1000 }}>
        <button
          onClick={() => setCreateMode((v) => !v)}
          aria-pressed={createMode}
          aria-label={createMode ? 'Cancel create pin' : 'Create pin'}
          style={{
            backgroundColor: createMode ? '#dc2626' : '#2563eb',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 8,
            boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {createMode ? 'Cancel' : 'Create pin'}
        </button>
      </div>

      <MapContainer
        center={[36.992255, -122.058763]}
        zoom={14.8}
        className="h-full"
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        minZoom={14.5}
        maxZoom={17}
        zoomSnap={0.1}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <style>{`
          .leaflet-marker-icon.marker-blue { filter: hue-rotate(0deg); }
          .leaflet-marker-icon.marker-green { filter: hue-rotate(250deg); }
          .leaflet-marker-icon.marker-red  { filter: hue-rotate(130deg); }
        `}</style>

        <MapClickHandler createMode={createMode} onMapClick={handleMapClick} />

        {markers.map((m) => {
          return (
            <MarkerWithPopup key={m.id} m={m} updateMarker={updateMarker} removeMarker={removeMarker} />
          );
        })}
      </MapContainer>

      {createMode && (
        <div className="absolute left-4 top-1/4 z-40 bg-white/90 px-3 py-2 rounded shadow">
          <div className="text-sm">Click anywhere on the map to place a pin.</div>
        </div>
      )}
    </div>
  );
}
