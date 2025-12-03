import { Link } from "react-router-dom";
import Logo from "../assets/slug_watch_logo.PNG";
import PersonIcon from "@mui/icons-material/Person";
import { useContext } from "react";
import { AuthContext } from "../App";
import ThemeToggle from "../dashboard/darkmodeToggle";

export default function NavBar() {
  const { session } = useContext(AuthContext);

  return (
    <nav className="p-4 bg-gray-100 dark:bg-gray-900 flex justify-between items-center">
      {/* Left side: Logo */}
      <Link to="/home" className="flex items-center">
        <img src={Logo} className="h-auto w-10 mr-2" alt="Logo" />
        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
          Slug Watch
        </div>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Links and Avatar */}
        {/* Dark/Light Mode Toggle */}
        <ThemeToggle />
        <div className="flex items-center space-x-3">
          <Link to="/home" className="text-gray-800 dark:text-gray-200">
            Home
          </Link>
          <Link to="/signin">
            {session ? (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="profile"
                className="rounded-full h-9 w-9 object-cover border border-gray-300 dark:border-gray-600"
              />
            ) : (
              <PersonIcon className="text-gray-800 dark:text-gray-200" />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
