import { Link } from "react-router-dom";
import Logo from "../assets/slug_watch_logo.PNG";
import PersonIcon from "@mui/icons-material/Person";
import { useContext } from "react";
import { AuthContext } from "../App";
import Notifications from "./Notifications";

export default function NavBar() {
  const { session } = useContext(AuthContext);

  return (
    <nav className="p-4 bg-gray-100 flex justify-between items-center">
      <Link to="/home" className="flex items-center">
        <img src={Logo} className="h-auto w-10 mr-2"></img>
        <div className="font-bold text-lg">Slug Watch</div>
      </Link>
      <div className="flex items-center space-x-3">
        <Link to="/home">Home</Link>
        {session && <Notifications />}
        <Link to="/moderation">Moderation</Link>
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
