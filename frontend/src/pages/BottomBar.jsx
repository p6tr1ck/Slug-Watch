import MapIcon from "@mui/icons-material/Map";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../App";
import Notifications from "./Notifications";

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

  const [showFilters, setShowFilters] = useState(false);

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
            <AddIcon fontSize="small" />
          </button>

          {/* Inbox */}
          <div className="flex flex-col items-center gap-1 min-w-[56px]">
            <Notifications />
            <span>Inbox</span>
          </div>

          {/* Profile */}
          <Link
            to="/signin"
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            {session ? (
              <img
                src={session.user.user_metadata.avatar_url}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <PersonIcon fontSize="small" />
            )}
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
