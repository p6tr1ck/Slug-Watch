import { useState, useContext, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import MakeMarker from "./MakeMarker";
import MarkerWithPopup from "./MarkerWithPopup";
import { send_report_db } from "../sbReportHandle";

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
    upvotes: Number(data.upvotes ?? 0),
    downvotes: Number(data.downvotes ?? 0),
    myVote: 0,
    certified: Boolean(data.certified),
  };
}

export default function UserPins() {
  const {
    session,
    viewMyPins,
    viewPolicePins,
    selectedPinId,
    setSelectedPinId,
  } = useContext(AuthContext);
  const [pins, setPins] = useState([]);
  const currUser = session?.user?.id ?? null;

  // subscribe to real time changes
  useEffect(() => {
    // handler for INSERT events
    const channel = supabase
      .channel("realtime:example_pins")
      // INSERT
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
      // UPDATE
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
      // DELETE
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

  async function handleReport(ticket) {
    //use supabase functions to send data (look at my old supaPins implem)
    console.log("ticket to submit: ", ticket);
    await send_report_db(ticket);
  }

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
                  id={pin.id}
                  m={m}
                  selectedPinId={selectedPinId}
                  setSelectedPinId={setSelectedPinId}
                  // The person who created the pin can modify their pin
                  canModify={true}
                />
              );
            }
            return null;
          })
        : pins.map((pin) => {
            const reportable =
              !!session && currUser && pin.user_id !== currUser;
            return (
              <MakeMarker
                key={pin.id}
                m={pin}
                selectedPinId={selectedPinId}
                setSelectedPinId={setSelectedPinId}
                // If the person logged in is the creator of the pin, they can modify it
                canModify={pin.user_id === session?.user?.id ? true : false}
                canReport={reportable}
              />
            );
          })}
    </>
  );
}
