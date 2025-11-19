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
  const {
    viewMyPins,
    setViewMyPins,
    session,
    createMode,
    setCreateMode,
    viewPolicePins,
    setViewPolicePins,
  } = useContext(AuthContext);

  return (
    <div className="fixed bottom-0 left-0 w-full h-20">
      <div className="p-4 bg-gray-100 flex justify-between items-center text-center">
        <Link to="/home">
          <MapIcon />
          <p>Home</p>
        </Link>
        <div>
          <button onClick={() => setViewPolicePins((v) => !v)}>
            {viewPolicePins ? <LocalPoliceIcon /> : <VisibilityOffIcon />}
            <p>Police Pins</p>
          </button>
        </div>
        <div>
          <button
            onClick={() => {
              if (!session) {
                // if user not signed in, send them to sign in
                window.location.href = "/signin";
                return;
              }
              setCreateMode((v) => !v);
            }}
            aria-pressed={createMode}
            aria-label={createMode ? "Cancel create pin" : "Create pin"}
            style={{
              backgroundColor: createMode ? "#dc2626" : "#2563eb",
              color: "#fff",
              padding: "8px",
              borderRadius: 8,
              boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AddIcon />
          </button>
        </div>
        <button onClick={() => setViewMyPins((v) => !v)}>
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
