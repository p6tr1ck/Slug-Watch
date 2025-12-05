import { useState, useEffect, useContext } from "react";
import { supabase } from "../../supabaseClient";
import GoogleButton from "react-google-button";
import { AuthContext, DarkModeSwitch } from "../App";
import LocationsCategories from "./LocationsCategories";
import SavePreferences from "./SavePreferences";
import useWindowDimensions from "../WindowDimensions";
import { Avatar, Button } from "@mui/material";

// Background + centering wrapper
const Wrapper = ({ theme, children }) => (
  <div
    className={`min-h-screen from-slate-50 to-white flex items-center justify-center px-4  ${
      theme === "light" ? "bg-white" : "bg-zinc-800"
    }`}
  >
    <div className="w-full max-w-lg mt-[-25vh]">{children}</div>
  </div>
);

export default function SignIn() {
  const { session } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const { theme } = useContext(DarkModeSwitch);
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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
      <div
        className={`h-50 flex justify-center items-center flex-col space-y-5 ${
          theme === "light" ? "text-gray-900" : "text-gray-200"
        }`}
      >
        <div className="text-lg">Welcome!</div>
        <div className="text-lg">Sign in with your UCSC email to continue:</div>
        <GoogleButton onClick={signUp} />
      </div>
    );
  }

  const name = session.user.user_metadata.full_name ?? "Student";
  const email = session.user.email ?? "";
  const avatarUrl = session.user.user_metadata.avatar_url;

  return (
    <Wrapper theme={theme}>
      <div
        className={`bg-white shadow-xl rounded-2xl p-8 border border-slate-200/70 ${
          theme === "light" ? "text-gray-900" : "text-gray-200"
        } ${theme === "light" ? "bg-white" : "bg-zinc-800"}`}
      >
        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl} alt={name} sx={{ width: 56, height: 56 }} />
          <div>
            <h2
              className={`text-xl font-semibold ${
                theme === "light" ? "text-slate-900" : "text-gray-200"
              }`}
            >
              Welcome, {name.split(" ")[0]} 👋
            </h2>
            <p
              className={`${
                theme === "light" ? "text-slate-600" : "text-gray-200"
              }`}
            >
              {email}
            </p>
          </div>
        </div>
        <LocationsCategories
          notifications={notifications}
          setNotifications={setNotifications}
        />
        <div className="mt-8 flex justify-between">
          <Button
            variant="outlined"
            onClick={signOut}
            sx={{ textTransform: "none", fontSize: 16, borderRadius: 2 }}
            disabled={busy}
          >
            {busy ? "Signing out…" : "Sign out"}
          </Button>
          <SavePreferences notifications={notifications} />
        </div>

        {busy && (
          <div className="mt-4 flex justify-center">
            <CircularProgress size={22} />
          </div>
        )}
        {err && <p className="mt-4 text-center text-sm text-red-600">{err}</p>}
      </div>
    </Wrapper>
  );
}
