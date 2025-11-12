import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import PoliceCar from "../assets/police-car-emoji.png";
import SuspiciousPerson from "../assets/suspicious-person-icon.png";

const tapsIcon = (category) => {
  return new L.Icon({
    iconUrl: PoliceCar,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [1, -34],
    category,
  });
};

const suspiciousPerson = (category) => {
  return new L.Icon({
    iconUrl: SuspiciousPerson,
    iconSize: [48, 48],
    iconAnchor: [16, 32],
    popupAnchor: [1, -34],
    category,
  });
};

const blueMarker = (category) => {
  return new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    category,
  });
};

export default function makeIcon(category) {
  if (category == "TAPS") {
    return tapsIcon(category);
  } else if (category == "Suspicious Activity") {
    return suspiciousPerson(category);
  } else {
    return blueMarker(category);
  }
}
