import MapIcon from "@mui/icons-material/Map";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../App";

export default function BottomBar() {
  const { viewMyPins, setViewMyPins, session } = useContext(AuthContext);
  function userPinVisibility() {
    if (!viewMyPins) {
      setViewMyPins(true);
    } else {
      setViewMyPins(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 w-full h-20">
      <div className="p-4 bg-gray-100 flex justify-between items-center text-center">
        <Link to="/home">
          <MapIcon />
          <p>Home</p>
        </Link>
        <div>
          <LocalPoliceIcon />
          <p>Police Pins</p>
        </div>
        <div className="border border-black">
          <button className="border border-black">
            <AddIcon />
          </button>
        </div>
        <button onClick={() => userPinVisibility()}>
          {viewMyPins ? <VisibilityIcon /> : <VisibilityOffIcon />}
          <p>My Pins</p>
        </button>
        <Link to="/signin">
          <div className="items-center justify-center text-center">
            {session ? (
              <img
                src={session.user.user_metadata.avatar_url}
                className="rounded-4xl h-9 block ml-auto mr-auto"
              />
            ) : (
              <PersonIcon />
            )}
            <p>Profile</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
