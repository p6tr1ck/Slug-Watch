import { Link } from "react-router-dom";
import Logo from "../assets/slug_watch_logo.PNG";
import PersonIcon from "@mui/icons-material/Person";
import { useContext, useEffect, useState } from "react";
import { AuthContext, DarkModeSwitch } from "../App";
import ThemeToggle from "../dashboard/DarkmodeToggle";
import { supabase } from "../../supabaseClient";
import Notifications from "./Notifications";

export default function NavBar() {
  const { session } = useContext(AuthContext);
  const { theme, setTheme } = useContext(DarkModeSwitch);
  const user = session?.user ?? null;
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setCanModerate(false);
      return undefined;
    }

    const verifyAdmin = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("admin")
        .eq("email", user.email)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Failed to verify admin status for navbar", error);
        setCanModerate(false);
        return;
      }

      setCanModerate(Boolean(data?.admin));
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  return (
    <nav
      className={`p-4 ${
        theme === "light" ? "bg-white" : "bg-zinc-800"
      } flex justify-between items-center`}
    >
      {/* Left side: Logo */}
      <Link to="/home" className="flex items-center">
        <img src={Logo} className="h-auto w-10 mr-2" alt="Logo" />
        <div
          className={`font-bold text-lg ${
            theme === "light" ? "text-gray-900" : "text-gray-200"
          }`}
        >
          Slug Watch
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Links and Avatar */}
        {/* Dark/Light Mode Toggle */}
        <ThemeToggle />
        <div className="flex items-center space-x-3">
          <Link
            to="/home"
            className={`${
              theme === "light" ? "text-gray-900" : "text-gray-200"
            }`}
          >
            Home
          </Link>
          {canModerate && <Link to="/moderation">Moderation</Link>}
          {session && <Notifications />}
          <Link to="/signin">
            {session ? (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="profile"
                className="rounded-full h-9 w-9 object-cover border border-gray-300 dark:border-gray-600"
              />
            ) : (
              <PersonIcon
                className={`${
                  theme === "light" ? "text-gray-900" : "text-gray-200"
                }`}
              />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
