import { useState, useContext, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import MakeMarker from "./MakeMarker";

export default function PolicePins() {
  const { viewPolicePins, viewMyPins, viewBookmarkedPins, bookmarks, toggleBookmark } = useContext(AuthContext);
  const [pins, setPins] = useState([]);

  // Pull police made pins from the database.
  useEffect(() => {
    async function getPins() {
      // Select all the rows from the police logs database table.
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
        category: e.category,
      }));

      // Now set the pins, so the pins array has the pin data.
      setPins(mapped);
    }
    getPins();
  }, []);

  // Filter pins based on bookmarked state
  const displayedPins = viewBookmarkedPins 
    ? pins.filter(pin => bookmarks.includes(`police-${pin.id}`)) 
    : pins;

  return (
    <>
      {!viewPolicePins && viewMyPins ? (
        <></>
      ) : (
        displayedPins.map((pin) => {
          const policePinId = `police-${pin.id}`;
          return (
            <MakeMarker
              key={pin.id}
              title={pin.title}
              time={pin.created_at}
              position={[pin.lat, pin.long]}
              category={"Verified"}
              pinId={policePinId}
              isBookmarked={bookmarks.includes(policePinId)}
              onBookmarkToggle={() => toggleBookmark(policePinId)}
            />
          );
        })
      )}
    </>
  );
}
