import { React, useEffect, useContext } from "react";
import { supabase } from "../../supabaseClient";
import GoogleButton from "react-google-button";
import { Button } from "@mui/material";
import { AuthContext } from "../App";

export default function SignIn() {
  const { session } = useContext(AuthContext);

  useEffect(() => {
    if (session) {
      async function uploadUserInfo() {
        // insert user information to sign ups table
        // if the user already exists, it ignores the query
        const { error } = await supabase
          .from("users")
          .upsert(
            { email: session.user.email, rep: 0 },
            { onConflict: "UID", ignoreDuplicates: true }
          )
          .select();
        if (error) {
          console.error(error);
        }
      }
      uploadUserInfo();
    }
  }, [session]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  const signUp = async () => {
    // redirect user to the sign in page after logging in
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/signin`,
        queryParams: {
          hd: "ucsc.edu",
        },
      },
    });
  };

  if (!session) {
    return (
      <div className="h-50 flex justify-center items-center flex-col space-y-5">
        <div className="text-lg">Welcome!</div>
        <div className="text-lg">Sign in with your UCSC email to continue:</div>
        <GoogleButton onClick={signUp} />
      </div>
    );
  } else {
    return (
      <div className="h-50 flex justify-center items-center flex-col space-y-5">
        <h2 className="text-lg">
          Welcome, {session.user.user_metadata.full_name}!
        </h2>
        <Button variant="outlined" className="text-lg" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }
}
