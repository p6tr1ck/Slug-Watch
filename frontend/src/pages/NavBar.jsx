import { Link } from "react-router-dom";
import Logo from "../assets/slug_watch_logo.PNG";
import PersonIcon from "@mui/icons-material/Person";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../App";
import { supabase } from "../../supabaseClient";
import Notifications from "./Notifications";

export default function NavBar() {
  const { session } = useContext(AuthContext);
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
    <nav className="p-4 bg-gray-100 flex justify-between items-center">
      <Link to="/home" className="flex items-center">
        <img src={Logo} className="h-auto w-10 mr-2"></img>
        <div className="font-bold text-lg">Slug Watch</div>
      </Link>
      <div className="flex items-center space-x-3">
        <Link to="/home">Home</Link>
        {canModerate && <Link to="/moderation">Moderation</Link>}
        {session && <Notifications />}
        <Link to="/signin">
          {session ? (
            <img
              src={session.user.user_metadata.avatar_url}
              className="rounded-4xl h-9"
            />
          ) : (
            <PersonIcon />
          )}
        </Link>
      </div>
    </nav>
  );
}
