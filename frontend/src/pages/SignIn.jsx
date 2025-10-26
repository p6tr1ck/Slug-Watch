import { React, useEffect, useState} from "react";
import { supabase } from "../../supabaseClient"

export default function SignIn() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  const signUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/home` }
    });
  };

  useEffect(() => {
    if (session) {
      const userDomainName = session.user.email.split("@")[1];
      const domainName = "ucsc.edu";
      console.log(userDomainName, domainName);
      if (userDomainName !== domainName) {
        supabase.auth.signOut();
      }
    }
  }, [session])

  if (!session) {
    return (
      <>
        <button onClick={signUp}>Sign in with Google</button>
      </>
    );
  } else {
    return (
      <div>
        <h2>Welcome, {session.user.email}</h2>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }
}
