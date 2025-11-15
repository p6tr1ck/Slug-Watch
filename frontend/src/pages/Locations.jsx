import { useContext } from "react";
import { AuthContext } from "../App";

const areas = [
  "College Nine",
  "Cowell College",
  "Crown College",
  "Family Student Housing",
  "John R. Lewis College",
  "Kresge College",
  "Merrill College",
  "Oakes College",
  "Porter College",
  "Stevenson College",
  "None",
  "All",
];

export default function Locations() {
  const { locations, setLocations } = useContext(AuthContext);

  const buttonEvent = (e) => {
    // Unselect "None" if a location is clicked.
    if (locations.includes("None") && e !== "None") {
      setLocations((prev) => prev.filter((loc) => loc !== "None"));
      return;
    }

    // Unselect all locations when None is clicked.
    if (e === "None") {
      setLocations([]);
      return;
    }

    // Unselect "All" if a location is clicked.
    if (locations.includes("All") && e !== "All") {
      setLocations((prev) => prev.filter((loc) => loc !== "All"));
    }

    // Unselect all locations when All is clicked.
    if (e === "All") {
      setLocations([e]);
      return;
    }

    setLocations((prev) => {
      if (!prev.includes(e)) {
        return [...prev, e];
      }
      return prev.filter((loc) => loc !== e);
    });
  };

  return (
    <div className="mt-6">
      <p className="text-slate-800 font-medium">Notification areas</p>
      <p className="text-slate-500 dark:text-slate-700 text-sm">
        Select locations to receive alerts.
      </p>
      <div
        className="mt-4 flex flex-wrap gap-2"
        onClick={(e) => {
          const btn = e.target.closest("button");
          if (!btn) return;
          const text = btn.textContent;
          buttonEvent(text);
        }}
      >
        {areas.map((label) => {
          const isSelected = locations.includes(label);
          return (
            <button
              key={label}
              className={`px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 transition
          hover:bg-slate-50 dark:hover:bg-slate-400
          ${
            isSelected || (label === "None" && locations.length === 0)
              ? "bg-blue-500 text-white"
              : "bg-white"
          }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
