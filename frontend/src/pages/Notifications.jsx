import NotificationsIcon from "@mui/icons-material/Notifications";
import { Badge } from "@mui/material";

export default function Notifications() {
  return (
    <>
      <button className="hover:cursor-pointer">
        <Badge color="secondary" badgeContent={0}>
          <NotificationsIcon />
        </Badge>
      </button>
    </>
  );
}
