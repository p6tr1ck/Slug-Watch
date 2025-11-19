import { useState, useContext, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import MakeMarker from "./MakeMarker";
import MarkerWithPopup from "./MarkerWithPopup";

export default function UserPins() {
  const { session, viewMyPins, viewPolicePins } = useContext(AuthContext);
  const [pins, setPins] = useState([]);

  // Pull user made pins from the database.
  useEffect(() => {
    async function getPins() {
      // Select all the rows from the example pins database table.
      const { data, error } = await supabase.from("example_pins").select("*");
      if (error) {
        console.error("Error getting pins from database: ", error);
        return;
      }

      // Create an array of all the pins fetched from the database table.
      const mapped = data.map((e) => {
        // Convert ISO timestamp to datetime-local format (YYYY-MM-DDTHH:mm)
        let datetimeLocal = "";
        if (e.created_at) {
          try {
            const d = new Date(e.created_at);
            datetimeLocal = d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
          } catch (err) {
            console.warn("Failed to parse created_at:", e.created_at);
          }
        }

        return {
          id: e.id,
          user_id: e.user_id,
          title: e.title,
          category: e.category,
          lat: e.lat,
          long: e.long,
          address: e.location || "",
          datetime: datetimeLocal,
          created_at: `${new Date(e.created_at).toLocaleDateString()} ${new Date(
            e.created_at
          ).toLocaleTimeString()}`, // Format as MM/DD/YY Time
          description: e.description,
        };
      });

      // Now set the pins, so the pins array has the pin data.
      setPins(mapped);
    }
    getPins();
  }, []);

  if (viewPolicePins && !viewMyPins) return null;
  // Handlers to update/remove pins locally after Supabase operations
  function updatePin(id, patch) {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePin(id) {
    setPins((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      {session && viewMyPins // User only wants to see their pins on the map
        ? pins.map((pin) => {
            if (pin.user_id === session.user.id) {
              const m = {
                id: pin.id,
                supabaseId: pin.id,
                ownerId: pin.user_id,
                position: [pin.lat, pin.long],
                title: pin.title,
                category: pin.category,
                description: pin.description,
                address: pin.address || "",
                datetime: pin.datetime || pin.created_at || "",
                className: "marker-blue",
                isNew: false,
              };

              return (
                <MarkerWithPopup
                  key={pin.id}
                  m={m}
                  updateMarker={updatePin}
                  removeMarker={removePin}
                  canModify={Boolean(session?.user?.id) && pin.user_id === session.user.id}
                />
              );
            }
            return null;
          })
        : pins.map((pin) => {
            return (
              <MakeMarker
                key={pin.id}
                title={pin.title}
                category={pin.category}
                description={pin.description}
                time={pin.created_at}
                position={[pin.lat, pin.long]}
                pinId={pin.id}
              />
            );
          })}
    </>
  );
}
