import MapIcon from "@mui/icons-material/Map";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";

export default function BottomBar() {
  return (
    <div className="p-4 bg-gray-100 flex justify-between items-center text-center">
      <div>
        <MapIcon />
        <p>Home</p>
      </div>
      <div>
        <LocalPoliceIcon />
        <p>Police Logs</p>
      </div>
      <div>
        <AddIcon />
      </div>
      <div>
        <VisibilityIcon />
        <p>My Pins</p>
      </div>
      <div>
        <PersonIcon />
        <p>Profile</p>
      </div>
    </div>
  );
}
