import { useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../supabaseClient";

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

function getIconForCategory(category) {
  switch (category) {
    case "vehicle accident":
      return makeIcon("marker-red");
    case "suspicious activity":
      return makeIcon("marker-blue");
    case "animal":
      return makeIcon("marker-green");
    default:
      return makeIcon();
  }
}

function getBBoxFromMap(map) {
  const b = map.getBounds();
  return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
}

function ViewportController({ onViewportChange }) {
  const map = useMap();

  useMapEvents({
    moveend() {
      const bbox = getBBoxFromMap(map);
      onViewportChange(bbox);
    },
    zoomend() {
      const bbox = getBBoxFromMap(map);
      onViewportChange(bbox);
    },
  });

  const [didInitialLoad] = useState(() => {
    const bbox = getBBoxFromMap(map);
    onViewportChange(bbox);
    return true;
  });

  void didInitialLoad;

  return null;
}

const position1 = [36.98946, -122.06124];
const position2 = [36.99456, -122.05432];

const bounds = [
  [36.972521, -122.071543], // southwest corner
  [37.003957, -122.045296], // northeast corner
];

export default function Map({ currentUserId = null }) {
  const [pins, setPins] = useState([]);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const latestRequestRef = useRef(0);
  const userId = currentUserId;

  async function loadPinsFromBackend(bbox) {
    if (!bbox) return;

    const [west, south, east, north] = bbox;
    const requestId = ++latestRequestRef.current;

    try {
      const [{ data: policeData, error: policeError }, { data: userData, error: userError }] =
        await Promise.all([
          supabase
            .from("police_logs")
            .select("id, crime, date, lat, longi")
            .gte("longi", west)
            .lte("longi", east)
            .gte("lat", south)
            .lte("lat", north),
          supabase
            .from("pins")
            .select("crime_name, lat, longi, details, created_at, user_id")
            .gte("longi", west)
            .lte("longi", east)
            .gte("lat", south)
            .lte("lat", north),
        ]);

      if (policeError) {
        console.error("Failed to load police pins from Supabase", policeError);
      }
      if (userError) {
        console.error("Failed to load user pins from Supabase", userError);
      }

      if (policeError && userError) {
        return;
      }

      if (requestId !== latestRequestRef.current) {
        return;
      }

      const parsedPins =
        (policeData ?? [])
          ?.filter((row) => row.lat != null && row.longi != null)
          .map((row) => ({
            id: row.id,
            lat: row.lat,
            lng: row.longi,
            title: row.crime ?? "Police log",
            category: row.crime ?? "uncategorized",
            description: row.date
              ? `Reported on ${new Date(row.date).toLocaleString()}`
              : "",
            userId: null,
          })) ?? [];

      const parsedUserPins =
        (userData ?? [])
          .filter((row) => row.lat != null && row.longi != null)
          .map((row, index) => {
            const descriptionParts = [];
            if (row.details) descriptionParts.push(row.details);
            if (row.created_at) {
              descriptionParts.push(`Submitted on ${new Date(row.created_at).toLocaleString()}`);
            }
            return {
              id: row.created_at
                ? `user-${row.created_at}`
                : `user-${row.lat}-${row.longi}-${index}`,
              lat: row.lat,
              lng: row.longi,
              title: row.crime_name ?? "Community report",
              category: row.crime_name ?? "community-report",
              description: descriptionParts.join("\n"),
              userId: row.user_id ?? null,
            };
          });

      setPins([...parsedPins, ...parsedUserPins]);
    } catch (err) {
      console.error("Unexpected error loading pins from Supabase", err);
    }
  }

  const ColorFilters = useMemo(
    () => (
      <style>{`
        .leaflet-marker-icon.marker-blue { filter: hue-rotate(0deg); }
        .leaflet-marker-icon.marker-green { filter: hue-rotate(250deg); }
        .leaflet-marker-icon.marker-red  { filter: hue-rotate(130deg); }
      `}</style>
    ),
    []
  );

  const pinsToDisplay =
    showOnlyMine && userId ? pins.filter((pin) => pin.userId === userId) : pins;

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <MapContainer
        center={[36.992255, -122.058763]}
        zoom={15.4}
        className="h-full"
        style={{ height: "100%", width: "100%" }}
        maxBounds={bounds}
        maxBoundsViscosity={1.0} // prevents user from panning outside bounds
        scrollWheelZoom={false} // prevent zooming out from bounds
        zoomControl={false} // remove zoom in/out buttons
        zoomSnap={0.1} // allow decimal zooming by 0.1, 0.2, 0.3, etc.
      >

        {ColorFilters}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      
        <ViewportController onViewportChange={loadPinsFromBackend} />

        {pinsToDisplay.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={getIconForCategory(pin.category)}
          >
            <Popup>
              <b>{pin.title}</b>
              <br />
              {pin.category ? (
                <span>
                  <i>Category:</i> {pin.category}
                  <br />
                </span>
              ) : null}
              {pin.description || "No details"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        type="button"
        onClick={() => setShowOnlyMine((prev) => !prev)}
        disabled={!userId}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 1000,
          background: userId ? "white" : "#f2f2f2",
          border: "1px solid #ccc",
          borderRadius: "0.375rem",
          padding: "0.5rem 1rem",
          cursor: userId ? "pointer" : "not-allowed",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
        title={userId ? undefined : "Sign in to filter by your pins"}
      >
        {showOnlyMine ? "View all pins" : "View my pins"}
      </button>
    </div>
  );
}
