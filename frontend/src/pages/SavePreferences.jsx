import { useContext, useState } from "react";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";
import { Button } from "@mui/material";

export default function SavePreferences({ notifications }) {
  const { session } = useContext(AuthContext);
  const [text, setText] = useState("Save preferences");

  const buttonEvent = async () => {
    if (!session) return;

    const { error } = await supabase
      .from("users")
      .update({ notifications })
      .eq("UID", session.user.id);

    if (error) {
      console.error("Error saving notifications: ", error);
      return;
    }

    setText("Notifications saved!");

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
