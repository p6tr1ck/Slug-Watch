import React from "react";
import Map from "../map/Map";

export default function Home() {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0">
        <Map className="h-full w-full" />
      </div>
    </div>
  );
}
