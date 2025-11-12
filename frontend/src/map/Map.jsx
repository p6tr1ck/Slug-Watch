import { useEffect, useRef, useState, useContext } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../../supabaseClient";
import PoliceCar from "../assets/police-car-emoji.png";
import useWindowDimensions from "../WindowDimensions";
import MarkerWithPopup from "./MarkerWithPopup";
import { AuthContext } from "../App";

// --- Example pin data ---
const position1 = [36.98946, -122.06124];
const position2 = [36.99456, -122.05432];

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

const tapsIcon = () => {
  return new L.Icon({
    iconUrl: PoliceCar,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [1, -34],
  });
};

function determineIcon(category) {
  if (category == "TAPS") {
    return tapsIcon();
  } else {
    return makeIcon("marker-blue");
  }
}

const bounds = [
  [36.97818, -122.07764], // southwest corner
  [37.004057, -122.035647], // northeast corner
];

const center = [36.992077, -122.058739];

export default function Map() {
  const [pins, setPins] = useState([]);
  const { session, viewMyPins, setViewMyPins } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const [createMode, setCreateMode] = useState(false);
  const [markers, setMarkers] = useState([
    {
      id: 1,
      position: position1,
      title: "Custom colored marker",
      address: "",
      datetime: "",
      category: "TAPS",
      description: "Category: Example\nDetail: Example",
      className: "marker-blue",
      ownerId: null,
    },
    {
      id: 2,
      position: position2,
      title: "Alert",
      address: "",
      datetime: "",
      category: "Theft",
      description: "Category: Safety\nDetail: Example red pin",
      className: "marker-red",
      ownerId: null,
    },
  ]);

  function clickMyPins() {
    if (viewMyPins) {
      setViewMyPins(false);
    } else {
      setViewMyPins(true);
    }
  }

  useEffect(() => {
    async function getPins() {
      const { data, error } = await supabase.from("example_pins").select("*");
      if (error) {
        console.error("Error getting pins from database: ", error);
        return;
      }
      const mapped = data.map((e) => ({
        id: e.id,
        user_id: e.user_id,
        title: e.title,
        category: e.category,
        lat: e.lat,
        long: e.long,
        created_at: e.created_at,
        description: e.description,
      }));
      setPins(mapped);
    }
    getPins();
  }, []);

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
      id: Date.now(),
      position: latlng,
      title: "",
      address: "",
      datetime: "",
      category: "TAPS",
      description: "",
      className: "marker-green",
      isNew: true,
      ownerId: session,
    };
    setMarkers((m) => [...m, newMarker]);
    setCreateMode(false);
  }

  function updateMarker(id, patch) {
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        if (!session || m.ownerId !== session) return m;
        return { ...m, ...patch };
      })
    );
  }

  function removeMarker(id) {
    setMarkers((prev) =>
      prev.filter((m) => {
        if (m.id !== id) return true;
        if (!session || m.ownerId !== session) return true;
        return false;
      })
    );
  }

  return (
    <div className="relative h-full w-full">
      {session ? ( // Show the create button only for logged in users.
        <div
          style={{ position: "absolute", right: 16, bottom: 16, zIndex: 1000 }}
        >
          <button
            onClick={() => setCreateMode((v) => !v)}
            aria-pressed={createMode}
            aria-label={createMode ? "Cancel create pin" : "Create pin"}
            style={{
              backgroundColor: createMode ? "#dc2626" : "#2563eb",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
              border: "none",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {createMode ? "Cancel" : "Create pin"}
          </button>
        </div>
      ) : (
        <></>
      )}
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
        {/* CSS filters to recolor the default marker icon */}
        <style>{`
        .leaflet-marker-icon.marker-blue { filter: hue-rotate(0deg); }
        .leaflet-marker-icon.marker-green { filter: hue-rotate(250deg); }
        .leaflet-marker-icon.marker-red  { filter: hue-rotate(130deg); }
      `}</style>
        {session && viewMyPins // User only wants to see their pins on the map
          ? pins.map((pin) => {
              if (pin.user_id === session.user.id) {
                return (
                  <Marker
                    position={[pin.lat, pin.long]}
                    icon={determineIcon(pin.category)}
                    key={pin.id}
                  >
                    <Popup>
                      <b>{pin.title}</b>
                      <br />
                      Category: <b>{pin.category}</b>
                      <br />
                      Description: {pin.description}
                    </Popup>
                  </Marker>
                );
              }
            })
          : pins.map((pin) => {
              return (
                <Marker
                  position={[pin.lat, pin.long]}
                  icon={determineIcon(pin.category)}
                  key={pin.id}
                >
                  <Popup>
                    <b>{pin.title}</b>
                    <br />
                    Category: <b>{pin.category}</b>
                    <br />
                    Description: {pin.description}
                  </Popup>
                </Marker>
              );
            })}
        {/* If logged in user is not on a mobile device, then put the create button to the bottom right of the screen*/}
        {session && width >= 600 ? (
          <button
            type="button"
            onClick={() => clickMyPins()}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              zIndex: 1000,
              background: session ? "white" : "#f2f2f2",
              border: "1px solid #ccc",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              cursor: session ? "pointer" : "not-allowed",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
            title={session ? undefined : "Sign in to filter by your pins"}
          >
            {viewMyPins ? "View all pins" : "View my pins"}
          </button>
        ) : (
          <></>
        )}
        <MapClickHandler createMode={createMode} onMapClick={handleMapClick} />
        {markers.map((m) => {
          const canModify = Boolean(session) && m.ownerId === session;
          return (
            <MarkerWithPopup
              key={m.id}
              m={m}
              updateMarker={updateMarker}
              removeMarker={removeMarker}
              canModify={canModify}
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
