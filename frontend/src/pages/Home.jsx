import React from "react";
import Map from "../map/Map";
import Dashboard from "../dashboard/Dashboard";

export default function Home() {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0">
        <Map className="h-full w-full" />
        <div className="absolute top-28 left-4 z-[1000] max-h-[80vh] overflow-y-auto">
          <Dashboard />
        </div>
      </div>
    </div>
  );
}
