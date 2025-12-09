import { useState, useRef, useEffect } from "react";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function MobileFilterPins({
  setViewMyPins,
  setViewPolicePins,
  setViewBookmarkedPins,
  session,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  // checkbox states
  const [filters, setFilters] = useState({
    police: false,
    mine: false,
    saved: false,
  });

  const handleToggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  function handleListKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  return (
    <Stack direction="row" spacing={2}>
      <div>
        <button
          ref={anchorRef}
          onClick={handleToggle}
          className="flex flex-col items-center gap-0.5 min-w-[48px]"
        >
          <FilterListIcon style={{ fontSize: 20 }} />
          <span className="text-[10px]">Filter Pins</span>
        </button>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === "bottom-start" ? "left top" : "left bottom",
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                    onKeyDown={handleListKeyDown}
                  >
                    <MenuItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={filters.police}
                            onChange={() => handleToggleFilter("police")}
                            onClick={() => setViewPolicePins((v) => !v)}
                          />
                        }
                        label="Police Pins"
                      />
                    </MenuItem>
                    {session && (
                      <MenuItem>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.mine}
                              onChange={() => handleToggleFilter("mine")}
                              onClick={() => {
                                setViewMyPins((v) => !v);
                              }}
                            />
                          }
                          label="My Pins"
                        />
                      </MenuItem>
                    )}
                    {session && (
                      <MenuItem>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={filters.saved}
                              onChange={() => handleToggleFilter("saved")}
                              onClick={() => {
                                setViewBookmarkedPins((v) => !v);
                              }}
                            />
                          }
                          label="Saved Pins"
                        />
                      </MenuItem>
                    )}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </Stack>
  );
}
