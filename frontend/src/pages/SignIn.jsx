import { React, useEffect, useContext } from "react";
import { supabase } from "../../supabaseClient";
import GoogleButton from "react-google-button";
import { Button } from "@mui/material";
import { AuthContext } from "../App";
import useWindowDimensions from "../WindowDimensions";

export default function SignIn() {
  const { session } = useContext(AuthContext);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (session) {
      // upload the user information to Supabase
      async function uploadUserInfo() {
        // insert user information to users table
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

  // sign out the user and deletes the stored session
  const signOut = async () => {
    await supabase.auth.signOut().catch(console.error);
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
      <div
        className={`${
          width <= 600 ? "h-full" : "h-[50vh]"
        } flex justify-center items-center flex-col space-y-5`}
      >
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
