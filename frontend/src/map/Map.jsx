import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

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

export default function Map() {
  const [pins, setPins] = useState([]);

  function loadPinsFromBackend(bbox) {
    const mock = [
      {
        id: "1",
        lat: 36.98946,
        lng: -122.06124,
        title: "Suspicious Individual at Science Hill",
        category: "suspicious activity",
        description:
          "Individual reported acting suspiciously reported near Science Hill around 10pm.",
      },
      {
        id: "2",
        lat: 36.99182,
        lng: -122.05897,
        title: "Stray Animal at Porter College",
        category: "animal",
        description:
          "Report of a stray dog running near Porter College dorm area.",
      },
      {
        id: "3",
        lat: 36.99501,
        lng: -122.05642,
        title: "Vehicle Accident at Main Entrance",
        category: "vehicle accident",
        description:
          "Minor collision near the main campus entrance.",
      }
    ];
    setPins(mock);
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

  return (
    <MapContainer
      center={[36.992255, -122.058763]}
      zoom={15.4}
      className="h-screen"
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

      {pins.map((pin) => (
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
  );
}
