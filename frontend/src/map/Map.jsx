import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
        url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${
          import.meta.env.VITE_MAPTILER_KEY
        }`}
      />
    </MapContainer>
  );
}
