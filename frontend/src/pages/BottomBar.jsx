import MapIcon from "@mui/icons-material/Map";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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
    setCreateMode,
    viewPolicePins,
    setViewPolicePins,
  } = useContext(AuthContext);

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000]">
      <div className="mx-auto bg-white/95 backdrop-blur border-t shadow-lg">
        <div className="relative flex items-center justify-around px-4 py-2 text-xs text-gray-700">
          {/* Home */}
          <Link
            to="/home"
            className="flex flex-col items-center gap-1 min-w-[56px]"
          >
            <MapIcon fontSize="small" />
            <span>Home</span>
          </Link>

          {/* Filter Pins + dropdown */}
          <div className="relative flex flex-col items-center min-w-[72px]">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex flex-col items-center gap-1"
            >
              <LocalPoliceIcon fontSize="small" />
              <span className="whitespace-nowrap">Filter Pins</span>
            </button>

            {showFilters && (
              <div className="absolute bottom-12 left-1/2 z-51 w-40 -translate-x-1/2 rounded-xl bg-white p-2 text-xs shadow-xl border border-gray-200">
                <p className="mb-1 text-[11px] font-semibold text-gray-500">
                  Show:
                </p>
                <button
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1 hover:bg-gray-100"
                  onClick={() => setViewMyPins((v) => !v)}
                >
                  <span>My Pins</span>
                  {viewMyPins ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )}
                </button>
                <button
                  className="mt-1 flex w-full items-center justify-between rounded-lg px-2 py-1 hover:bg-gray-100"
                  onClick={() => setViewPolicePins((v) => !v)}
                >
                  <span>Police Pins</span>
                  {viewPolicePins ? (
                    <VisibilityIcon fontSize="small" />
                  ) : (
                    <VisibilityOffIcon fontSize="small" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Add / Create Pin */}
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border border-white"
            onClick={() => setCreateMode((v) => !v)}
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
