import React from "react";
import Map from "../map/Map";
import Dashboard from "../dashboard/Dashboard";
import useWindowDimensions from "../WindowDimensions";

export default function Home() {
  const { width } = useWindowDimensions();
  const isMobile = width <= 600;

  return (
    <div className={`flex-1 min-h-0 flex flex-col ${isMobile ? "pb-20" : ""}`}>
      <div className="flex-1 min-h-0">
        <Map className="h-full w-full" />
        <div className="absolute top-28 left-4 z-[1000] max-h-[80vh] overflow-y-auto">
          <Dashboard />
        </div>
      </div>
    </div>
  );
}
