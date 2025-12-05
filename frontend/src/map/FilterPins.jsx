import { useContext, useState, useEffect } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import TuneIcon from "@mui/icons-material/Tune";
import { AuthContext } from "../App";

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

export default function MultipleSelectCheckmarks() {
  const [filterName, setFilterName] = useState([]);
  const { setViewMyPins, setViewPolicePins, setViewBookmarkedPins, session } = useContext(AuthContext);
  const filters = ["Police Pins"];

  if (session) {
    filters.push("My Pins");
    filters.push("Bookmarked Pins");
  }

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setFilterName(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

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
          top: "1rem",
          right: "1rem",
          zIndex: 1000,
          bgcolor: "white",
        }}
      >
        <InputLabel id="demo-multiple-checkbox-label">
          <TuneIcon className="mr-2" />
          Filter Pins
        </InputLabel>
        <Select
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
