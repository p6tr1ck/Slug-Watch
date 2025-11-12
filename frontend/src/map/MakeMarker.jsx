import { Marker, Popup } from "react-leaflet";
import makeIcon from "./MakeIcon";

export default function MakeMarker({
  title,
  category,
  description,
  time,
  position,
}) {
  return (
    <Marker position={position} icon={makeIcon(category)}>
      <Popup>
        <div className="text-lg font-semibold">{title}</div>
        <br />
        <div className="text-base mt-1">
          <div>
            <span className="font-semibold">Incident Time:</span> {time}
          </div>
          <div>
            <span className="font-semibold">Category:</span> {category}
          </div>
          <div>
            <span className="font-semibold">Description:</span> {description}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
