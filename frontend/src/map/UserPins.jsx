import { useState, useContext, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import MakeMarker from "./MakeMarker";
import isInBounds from "./boundsCheck";

function mapPin(data) {
  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    category: data.category,
    lat: data.lat,
    long: data.long,
    created_at: `${new Date(data.created_at).toLocaleDateString()} ${new Date(
      data.created_at
    ).toLocaleTimeString()}`, // Format as MM/DD/YY Time
    description: data.description,
  };
}

export default function UserPins() {
  const { session, viewMyPins, viewPolicePins } = useContext(AuthContext);
  const [pins, setPins] = useState([]);

  // subscribe to real time changes
  useEffect(() => {
    // handler for INSERT events
    const channel = supabase
      .channel("realtime:example_pins")
      // INSERT → use handler that can do async/notifications
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "example_pins",
        },
        (payload) => {
          setPins((prev) => [...prev, mapPin(payload.new)]);
        }
      )
      // UPDATE → replace the pin in state
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "example_pins",
        },
        (payload) => {
          setPins((prev) =>
            prev.map((p) => (p.id === payload.new.id ? mapPin(payload.new) : p))
          );
        }
      )
      // DELETE → remove the pin
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "example_pins",
        },
        (payload) => {
          setPins((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    // cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial pull of user made pins from the database.
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
        return mapPin(e);
      });

      // Now set the pins, so the pins array has the pin data.
      setPins(mapped);
    }
    getPins();
  }, []);

  if (viewPolicePins && !viewMyPins) return null;
  return (
    <>
      {session && viewMyPins // User only wants to see their pins on the map
        ? pins.map((pin) => {
            if (pin.user_id === session.user.id) {
              return (
                <MakeMarker
                  key={pin.id}
                  title={pin.title}
                  category={pin.category}
                  description={pin.description}
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
                category={pin.category}
                description={pin.description}
                time={pin.created_at}
                position={[pin.lat, pin.long]}
              />
            );
          })}
    </>
  );
}
