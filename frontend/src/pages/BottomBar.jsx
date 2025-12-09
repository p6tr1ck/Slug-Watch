import MapIcon from "@mui/icons-material/Map";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PushPinIcon from "@mui/icons-material/PushPin";
import { Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../App";
import Notifications from "./Notifications";
import useWindowDimensions from "../WindowDimensions";
import MobileFilterPins from "./MobileFilterPins";

export default function BottomBar() {
  const {
    viewMyPins,
    setViewMyPins,
    session,
    createMode,
    setCreateMode,
    viewPolicePins,
    setViewPolicePins,
    viewBookmarkedPins,
    setViewBookmarkedPins,
  } = useContext(AuthContext);

  const [showFilters, setShowFilters] = useState(false);
  const { width } = useWindowDimensions();

  return (
    <div className="fixed bottom-0 left-0 w-full z-[1000] bg-white border-t border-gray-200 shadow-lg">
      <div className="px-1 py-2 flex justify-around items-end">
        {/* Home */}
        <Link
          to="/home"
          className="flex flex-col items-center gap-0.5 min-w-[48px]"
        >
          <MapIcon style={{ fontSize: 20 }} />
          <span className="text-[10px]">Home</span>
        </Link>
        {/* Filter Pins */}
        <MobileFilterPins
          setViewMyPins={setViewMyPins}
          setViewPolicePins={setViewPolicePins}
          setViewBookmarkedPins={setViewBookmarkedPins}
          session={session}
        />

        {/* Create Pin */}
        <button
          onClick={() => {
            if (!session) {
              window.location.href = "/signin";
              return;
            }
            setCreateMode((v) => !v);
          }}
          className={`flex flex-col items-center gap-0.5 min-w-[48px] ${
            createMode ? "text-red-600" : ""
          }`}
        >
          <AddIcon style={{ fontSize: 20 }} />
          <span className="text-[10px]">
            {createMode ? "Cancel" : "Create"}
          </span>
        </button>

        {/* Inbox */}
        <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
          <Notifications />
          <span className="text-[10px]">Inbox</span>
        </div>

        {/* Profile */}
        <Link
          to="/signin"
          className="flex flex-col items-center gap-0.5 min-w-[48px]"
        >
          {session ? (
            <img
              src={session.user.user_metadata.avatar_url}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <PersonIcon style={{ fontSize: 20 }} />
          )}
          <span className="text-[10px]">Profile</span>
        </Link>
      </div>
    </div>
  );
}
