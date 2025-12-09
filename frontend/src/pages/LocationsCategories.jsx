import { useContext, useEffect } from "react";
import { AuthContext, DarkModeSwitch } from "../App";
import { supabase } from "../../supabaseClient";
import { useState } from "react";

const areas = [
  "College Nine & John R. Lewis College",
  "Cowell & Stevenson College",
  "Crown & Merrill College",
  "Porter & Kresge College",
  "Oakes & Rachel Carson College",
  "Family Student Housing",
  "West Remote Parking Lot",
  "East Remote Parking Lot",
];

const categories = ["ICE", "TAPS", "Theft", "Suspicious Activity", "Other"];

const selectableNotifications = [...areas, ...categories, "None", "All"];

export default function LocationsCateogries({
  notifications,
  setNotifications,
}) {
  const { session } = useContext(AuthContext);
  const { theme } = useContext(DarkModeSwitch);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get the notification preferences from the user on initial laod
    async function getNotificationColumn() {
      if (!session) return;
      const { data, error } = await supabase
        .from("users")
        .select("notifications")
        .eq("UID", session.user.id)
        .single();

      if (error) {
        console.error("Could not get notifications from user, error: ", error);
      }

      if (data?.notifications) setNotifications(data.notifications);
      setIsLoaded(true);
    }

    getNotificationColumn();
  }, []);

  const buttonEvent = (e) => {
    // Unselect "None" if a location or category is clicked.
    if (notifications.includes("None") && e !== "None") {
      setNotifications((prev) => prev.filter((n) => n !== "None"));
      return;
    }

    // Unselect all locations and categories when None is clicked.
    if (e === "None") {
      setNotifications([]);
      return;
    }

    // Unselect "All" if a location or category is clicked.
    if (notifications.includes("All") && e !== "All") {
      setNotifications((prev) => prev.filter((n) => n !== "All"));
    }

    // Unselect all locations and categories when All is clicked.
    if (e === "All") {
      setNotifications([e]);
      return;
    }

    setNotifications((prev) => {
      if (!prev.includes(e)) {
        return [...prev, e];
      }
      return prev.filter((loc) => loc !== e);
    });
  };

  return (
    <div className="mt-6">
      <p
        className={`font-medium ${
          theme === "light" ? "text-slate-800" : "text-slate-300"
        }`}
      >
        Notification areas
      </p>
      <p
        className={`text-sm ${
          theme === "light" ? "text-slate-500" : "text-slate-100"
        }`}
      >
        Select locations or categories to receive alerts.
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
        {selectableNotifications.map((label) => {
          const isSelected = notifications.includes(label);
          return (
            <button
              key={label}
              className={`px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 transition
          hover:bg-slate-50 dark:hover:bg-slate-400 ${
            theme === "light" ? "text-black" : "text-white"
          } ${
                theme === "light" &&
                !isSelected &&
                label !== "None" &&
                "bg-white"
              }
              
              ${
                theme === "dark" &&
                !isSelected &&
                label !== "None" &&
                "bg-zinc-500"
              }

          ${
            isSelected ||
            (isLoaded && label === "None" && notifications.length === 0)
              ? "bg-blue-500 text-white"
              : theme === "dark"
              ? "bg-zinc-500"
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
