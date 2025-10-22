import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function Map() {
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

      {/* Example markers in different colors */}
      <Marker position={position1} icon={makeIcon("marker-blue")}>
        <Popup>
          <b>Custom colored marker</b><br />
          Category: Example<br />
          Detail: Example
        </Popup>
      </Marker>

      <Marker position={position2} icon={makeIcon("marker-red")}>
        <Popup>
          <b>Alert</b><br />
          Category: Safety<br />
          Detail: Example red pin
        </Popup>
      </Marker>
    </MapContainer>
  );
}
