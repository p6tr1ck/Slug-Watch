import { CircularProgress, Button, Avatar } from "@mui/material";
import { useEffect, useContext, useState } from "react";
import { supabase } from "../../supabaseClient";
import GoogleButton from "react-google-button";
import { AuthContext } from "../App";

export default function SignIn() {
  const { session } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      try {
        setBusy(true);
        const { error } = await supabase
          .from("users")
          .upsert(
            { email: session.user.email, rep: 0 },
            { onConflict: "UID", ignoreDuplicates: true }
          )
          .select();
        if (error && !cancelled) setErr("Couldn’t save your profile.");
      } catch {
        if (!cancelled) setErr("Something went wrong.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const signOut = async () => {
    try {
      setBusy(true);
      await supabase.auth.signOut();
    } catch (e) {
      setErr("Sign out failed.");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/signin`,
        queryParams: { hd: "ucsc.edu" },
      },
    });
  };

  // Background + centering wrapper
  const Wrapper = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg mt-[-25vh]">{children}</div>
    </div>
  );

  if (!session) {
    return (
      <Wrapper>
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200/70">
          <h1 className="text-2xl font-semibold text-slate-600 text-center">
            Welcome
          </h1>
          <p className="text-slate-600 text-center mt-2">
            Sign in with your <span className="font-medium">UCSC</span> email to
            continue
          </p>

          <div className="mt-6 flex justify-center">
            <GoogleButton onClick={() => signUp()}>
              Continue with Google
            </GoogleButton>
          </div>

          {busy && (
            <div className="mt-6 flex justify-center">
              <CircularProgress size={24} />
            </div>
          )}
          {err && (
            <p className="mt-4 text-center text-sm text-red-600">{err}</p>
          )}
        </div>
      </Wrapper>
    );
  }

  const name = session.user.user_metadata.full_name ?? "Student";
  const email = session.user.email ?? "";
  const avatarUrl = session.user.user_metadata.avatar_url;

  return (
    <Wrapper>
      <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200/70">
        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl} alt={name} sx={{ width: 56, height: 56 }} />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Welcome, {name.split(" ")[0]} 👋
            </h2>
            <p className="text-slate-600">{email}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-slate-800 font-medium">Notification areas</p>
          <p className="text-slate-500 dark:text-slate-700 text-sm">
            Select locations to receive alerts.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              College Nine
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Cowell College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Crown College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              John R. Lewis College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Kresge College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Merrill College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Oakes College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Porter College
            </button>
            <button className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-400 transition">
              Stevenson College
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <Button
            variant="outlined"
            onClick={signOut}
            sx={{ textTransform: "none", fontSize: 16, borderRadius: 2 }}
            disabled={busy}
          >
            {busy ? "Signing out…" : "Sign out"}
          </Button>
          <Button
            variant="contained"
            sx={{ textTransform: "none", fontSize: 16, borderRadius: 2 }}
          >
            Save preferences
          </Button>
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
