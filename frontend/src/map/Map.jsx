import { useEffect, useState, useContext } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import useWindowDimensions from "../WindowDimensions";
import MarkerWithPopup from "./MarkerWithPopup";
import { AuthContext } from "../App";
import UserPins from "./UserPins";
import PolicePins from "./PolicePins";
import FilterPins from "./FilterPins";

const bounds = [
  [36.97818, -122.07764], // southwest corner
  [37.004057, -122.035647], // northeast corner
];

export default function Map() {
  const { session, createMode, setCreateMode } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const [markers, setMarkers] = useState([]);
  const [tempId, setTempId] = useState(0);

  useEffect(() => {
    if (!session && createMode) {
      setCreateMode(false);
    }
  }, [session, createMode]);

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
    if (!session) {
      setCreateMode(false);
      return;
    }
    const newMarker = {
      id: tempId, // create a temp ID for the new marker
      position: latlng,
      title: "",
      address: "",
      datetime: "",
      category: "TAPS",
      description: "",
      className: "marker-green",
      isNew: true,
      ownerId: session?.user?.id || session,
    };
    // increment the temp id for the next new marker
    setTempId(tempId + 1);
    setMarkers((m) => [...m, newMarker]);
    setCreateMode(false);
  }

  function updateMarker(id, patch) {
    const userId = session?.user?.id || session;
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (!userId || m.ownerId !== userId) return m;
        return { ...m, ...patch };
      })
    );
  }

  function removeMarker(id) {
    const userId = session?.user?.id || session;
    setMarkers((prev) =>
      prev.filter((m) => {
        if (m.id !== id) return true;
        if (!userId || m.ownerId !== userId) return true;
        return false;
      })
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[36.992255, -122.058763]}
        zoom={14.8}
        className="h-full"
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        minZoom={14.5}
        maxZoom={17}
        zoomSnap={0.1}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* CSS filters to recolor the default marker icon */}
        <style>{`
        .leaflet-marker-icon.marker-blue { filter: hue-rotate(0deg); }
        .leaflet-marker-icon.marker-green { filter: hue-rotate(250deg); }
        .leaflet-marker-icon.marker-red  { filter: hue-rotate(130deg); }
      `}</style>
        {/* If user is not on a mobile device, then put the filter pins button 
        at the top right of screen. */}
        {width >= 600 && <FilterPins />}
        <UserPins />
        <PolicePins />
        <MapClickHandler createMode={createMode} onMapClick={handleMapClick} />
        {markers.map((m) => {
          const userId = session?.user?.id || session;
          const canModify = Boolean(userId) && m.ownerId === userId;
          return (
            <MarkerWithPopup
              key={m.id}
              m={m}
              updateMarker={updateMarker}
              removeMarker={removeMarker}
              setMarkers={setMarkers}
            />
          );
        })}

        {createMode && (
          <div className="absolute left-4 top-1/4 z-40 bg-white/90 px-3 py-2 rounded shadow">
            <div className="text-sm">
              Click anywhere on the map to place a pin.
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}
