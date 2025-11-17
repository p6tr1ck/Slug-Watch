const oakes = [
  [36.988279, -122.067579],
  [36.990666, -122.061514],
];

export default function isInBounds(pinLat, pinLng) {
  const [sw, ne] = oakes;
  const [latSouth, lngWest] = sw;
  const [latNorth, lngEast] = ne;

  return (
    pinLat >= latSouth &&
    pinLat <= latNorth &&
    pinLng >= lngWest &&
    pinLng <= lngEast
  );
}
