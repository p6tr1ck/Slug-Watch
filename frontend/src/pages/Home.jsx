import React from "react";
import Map from "../map/Map"
import NavBar from "../pages/NavBar";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <Map className="w-screen h-screen"></Map>
    </div>
  );
}
