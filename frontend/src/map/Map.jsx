import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { supabase } from "../../supabaseClient";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../App";
import PoliceCar from "../assets/police-car-emoji.png";
import useWindowDimensions from "../WindowDimensions";

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

  return (
    <div className="relative h-full">
      <MapContainer
        center={center}
        zoom={14.8}
        className="h-full"
        maxBounds={bounds}
        maxBoundsViscosity={1.0} // prevents user from panning outside bounds
        minZoom={14.5} // restricts min zoom
        maxZoom={17} // restricts max zoom
        zoomSnap={0.1} // allow decimal zooming by 0.1, 0.2, 0.3, etc.
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
        {session && viewMyPins
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
      </MapContainer>
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
    </div>
  );
}
