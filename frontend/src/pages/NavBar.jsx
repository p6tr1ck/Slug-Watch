import { Link } from "react-router-dom";
import Logo from "../assets/slug_watch_logo.PNG";
import PersonIcon from "@mui/icons-material/Person";
import { useContext, useState } from "react";
import { AuthContext } from "../App";

export default function NavBar() {
  const { session, viewMyPins, setViewMyPins } = useContext(AuthContext);
  const [myPinsText, setMyPinsText] = useState("My Pins Off");

  function clickMyPins() {
    if (viewMyPins) {
      setViewMyPins(false);
      setMyPinsText("My Pins Off");
    } else {
      setViewMyPins(true);
      setMyPinsText("My Pins On");
    }
  }

  return (
    <nav className="p-4 bg-gray-100 flex justify-between items-center">
      <Link to="/home" className="flex items-center">
        <img src={Logo} className="h-auto w-10 mr-2"></img>
        <div className="font-bold text-lg">Slug Watch</div>
      </Link>
      <div className="flex items-center space-x-3">
        {session ? (
          <button onClick={() => clickMyPins()}>{myPinsText}</button>
        ) : (
          <></>
        )}
        <Link to="/home">Home</Link>
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
