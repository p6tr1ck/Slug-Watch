import { useState, useContext, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import MakeMarker from "./MakeMarker";

export default function PolicePins() {
  const { session, viewMyPins } = useContext(AuthContext);
  const [pins, setPins] = useState([]);

  // Pull user made pins from the database.
  useEffect(() => {
    async function getPins() {
      // Select all the rows from the example pins database table.
      const { data, error } = await supabase.from("police_logs").select("*");
      if (error) {
        console.error("Error getting pins from database: ", error);
        return;
      }

      // Create an array of all the pins fetched from the database table.
      const mapped = data.map((e) => ({
        id: e.id,
        title: e.crime,
        lat: e.lat,
        long: e.long,
        created_at: `${new Date(e.date).toLocaleDateString()} ${new Date(
          e.date
        ).toLocaleTimeString()}`, // Format as MM/DD/YY Time
        description: e.description,
      }));

      // Now set the pins, so the pins array has the pin data.
      setPins(mapped);
    }
    getPins();
  }, []);

  return (
    <>
      {session && viewMyPins // User only wants to see their pins on the map
        ? pins.map((pin) => {
            if (pin.user_id === session.user.id) {
              return (
                <MakeMarker
                  key={pin.id}
                  title={pin.title}
                  time={pin.time}
                  position={[pin.lat, pin.long]}
                />
              );
            }
          })
        : pins.map((pin) => {
            return (
              <MakeMarker
                key={pin.id}
                title={pin.title}
                time={pin.created_at}
                position={[pin.lat, pin.long]}
                category={"Verified"}
              />
            );
          })}
    </>
  );
}
