// College Nine & John R. Lewis College
const C9_JRL = [
  [36.999007, -122.0598],
  [37.003422, -122.056562],
];

// Cowell & Stevenson College
const COWELL_STEVENSON = [
  [36.995583, -122.055846],
  [36.998411, -122.050036],
];

// Crown & Merill College
const CROWN_MERILL = [
  [36.998664, -122.055802],
  [37.00204, -122.050099],
];

// Porter & Kresge College
const PORTER_KRESGE = [
  [36.993226, -122.067487],
  [36.999331, -122.065287],
];

// Oakes & Rachel Carson College
const OAKES_RCC = [
  [36.988121, -122.067103],
  [36.992696, -122.06213],
];

// Family Student Housing
const FSH = [
  [36.988584, -122.070235],
  [36.993092, -122.066375],
];

// West Remote Parking Lot
const WEST_REMOTE = [
  [36.988068, -122.067203],
  [36.988837, -122.06467],
];

// East Remote Parking Lot
const EAST_REMOTE = [
  [36.98977, -122.054972],
  [36.992135, -122.050126],
];
const locations = {
  C9_JRL: C9_JRL,
  COWELL_STEVENSON: COWELL_STEVENSON,
  CROWN_MERILL: CROWN_MERILL,
  PORTER_KRESGE: PORTER_KRESGE,
  OAKES_RCC: OAKES_RCC,
  FSH: FSH,
  WEST_REMOTE: WEST_REMOTE,
  EAST_REMOTE: EAST_REMOTE,
};

const alias = {
  C9_JRL: "College Nine & John R. Lewis College",
  COWELL_STEVENSON: "Cowell & Stevenson College",
  CROWN_MERILL: "Crown & Merill College",
  PORTER_KRESGE: "Porter & Kresge College",
  OAKES_RCC: "Oakes & Rachel Carson College",
  FSH: "Family Student Housing",
  WEST_REMOTE: "West Remote Parking Lot",
  EAST_REMOTE: "East Remote Parking Lot",
};

export default function isInBounds(pinLat, pinLng) {
  for (const key in locations) {
    const [sw, ne] = locations[key];
    const [latSouth, lngWest] = sw;
    const [latNorth, lngEast] = ne;

    if (
      pinLat >= latSouth &&
      pinLat <= latNorth &&
      pinLng >= lngWest &&
      pinLng <= lngEast
    ) {
      return alias[key];
    }
  }
  return null;
}
