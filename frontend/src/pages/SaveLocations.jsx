import { useContext, useState } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import { Button } from "@mui/material";
import { useEffect } from "react";

export default function SaveLocations() {
  const { session, locations } = useContext(AuthContext);
  const [text, setText] = useState("Save preferences");

  const buttonEvent = async () => {
    if (!session) return;

    const { error } = await supabase
      .from("users")
      .update({ locations })
      .eq("UID", session.user.id);

    if (error) {
      console.error("Error saving locations: ", error);
      return;
    }

    setText("Location saved!");

    setTimeout(() => {
      setText("Save preferences");
    }, "2000");
  };

  return (
    <>
      <Button
        variant="contained"
        sx={{ textTransform: "none", fontSize: 16, borderRadius: 2 }}
        onClick={() => buttonEvent()}
      >
        {text}
      </Button>
    </>
  );
}
