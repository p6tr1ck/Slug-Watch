import { React, useEffect, useContext } from "react";
import { supabase } from "../../supabaseClient";
import GoogleButton from "react-google-button";
import { Button } from "@mui/material";
import { AuthContext } from "../App";

export default function SignIn() {
  const { session, setSession } = useContext(AuthContext);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  const signUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` },
    });
  };

  useEffect(() => {
    if (session) {
      const userDomainName = session.user.email.split("@")[1];
      const domainName = "ucsc.edu";
      // If email is not a ucsc one, sign out
      if (userDomainName !== domainName) {
        supabase.auth.signOut();
      }
    }
  }, [session]);

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
