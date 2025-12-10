import { useContext, useState, useEffect } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import TuneIcon from "@mui/icons-material/Tune";
import { AuthContext, DarkModeSwitch } from "../App";

// Styling for the menu items
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 200,
      bgcolor: "white",
      color: "black",
    },
  },
};

// Handle multiple selection of the menu items
export default function MultipleSelectCheckmarks() {
  const [filterName, setFilterName] = useState([]);
  const { theme } = useContext(DarkModeSwitch);

  const { setViewMyPins, setViewPolicePins, setViewBookmarkedPins, session } =
    useContext(AuthContext);
  const filters = ["Police Pins"];

  // If user is logged in, then the filter pins menu
  // will have a my pins and bookmarked pins to the menu.
  if (session) {
    filters.push("My Pins");
    filters.push("Bookmarked Pins");
  }

  // If menu item is clicked then set the filter name to
  // the name of the menu item.
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setFilterName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  // If the state changes for viewing police pins, my pins,
  // or bookmarked pins, then update it
  useEffect(() => {
    setViewMyPins(filterName.includes("My Pins"));
    setViewPolicePins(filterName.includes("Police Pins"));
    setViewBookmarkedPins(filterName.includes("Bookmarked Pins"));
  }, [filterName, setViewMyPins, setViewPolicePins, setViewBookmarkedPins]);

  return (
    <div>
      <FormControl
        sx={{
          m: 1,
          width: 200,
          position: "absolute",
          top: "3px",
          right: "4px",
          zIndex: 1000,
          bgcolor: theme === "light" ? "white" : "#293240",
        }}
      >
        <InputLabel
          id="demo-multiple-checkbox-label"
          sx={{
            color: theme === "dark" && "white",
          }}
        >
          <TuneIcon className="mr-2" />
          Filter Pins
        </InputLabel>
        <Select
          sx={{
            "& .MuiSelect-icon": {
              color: theme === "dark" ? "white" : "black",
            },
          }}
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={filterName}
          onChange={handleChange}
          input={<OutlinedInput label="Tag" />}
          renderValue={(selected) => selected.join(", ")}
          MenuProps={MenuProps}
        >
          {filters.map((filter) => (
            <MenuItem key={filter} value={filter}>
              <Checkbox checked={filterName.includes(filter)} />
              <ListItemText primary={filter} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
