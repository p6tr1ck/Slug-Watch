import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import { Badge, IconButton } from "@mui/material";
import { useState, useContext, useEffect } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { supabase } from "../../supabaseClient";
import { AuthContext } from "../App";

export default function Notification() {
  const { session } = useContext(AuthContext);
  const [pinId, setPinId] = useState([]);
  const [pins, setPins] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);

    // Set is_read column to true for all the pins
    async function readNotifications() {
      for (const id of pinId) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", session.user.id)
          .eq("pin_id", id)
          .eq("is_read", false);

        if (error) {
          console.error("Error setting is_read column: ", error);
        }
      }
      setUnreadNotifications(0);
    }
    readNotifications();
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Clear a single notification
  const handleClearOne = (event, id) => {
    event.stopPropagation(); // don't trigger MenuItem onClick

    async function deleteNotifications() {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", session.user.id)
        .eq("pin_id", id);

      if (error) {
        console.error("Error deleting notification: ", error);
      }
    }
    deleteNotifications();
    setPins((prev) => prev.filter((p) => p.id !== id));
  };

  // Clear all notifications (UI only)
  const handleClearAll = () => {
    async function deleteAllNotifications() {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error deleting all notification: ", error);
      }
    }
    deleteAllNotifications();
    setPins([]);
  };

  // subscribe to real time changes
  useEffect(() => {
    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          async function handleInsert() {
            const userId = payload.new.user_id;
            const newPinId = payload.new.pin_id;

            if (session && userId === session.user.id) {
              setPinId((prev) => [...prev, newPinId]);
              setUnreadNotifications(unreadNotifications + 1);
            }
          }
          handleInsert();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Read notifications from initial load
  useEffect(() => {
    async function getNotifications() {
      if (session) {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error retrieving notifications: ", error);
          return;
        }

        if (data) {
          setPinId(data.map((d) => d.pin_id));
          if (data.is_read === false) {
            setUnreadNotifications(unreadNotifications + 1);
          }
        }
      }
    }
    getNotifications();
  }, [session]);

  // For each pinId, load the pin
  useEffect(() => {
    async function getPins() {
      if (pinId && pinId.length > 0) {
        for (const id of pinId) {
          const { data, error } = await supabase
            .from("example_pins")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            console.log("Error loading pins: ", error);
          } else {
            setPins((prev) => {
              if (prev.some((p) => p.id === data.id)) {
                return prev;
              }
              const updated = [...prev, data];

              // Sort newest to oldest
              updated.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              );

              return updated;
            });
          }
        }
      }
    }
    getPins();
  }, [pinId]);

  return (
    <div>
      <Button
        id="notifications-button"
        aria-controls={open ? "notifications-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <Badge
          color="secondary"
          badgeContent={unreadNotifications}
          overlap="circular"
        >
          <NotificationsIcon />
        </Badge>
      </Button>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "notifications-button",
          },
        }}
        PaperProps={{
          sx: {
            minWidth: 260,
          },
        }}
      >
        {/* Header row */}
        <MenuItem
          disabled
          sx={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600,
            fontSize: 14,
            opacity: 1,
          }}
        >
          <span>Notifications</span>
          {pins.length > 0 && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
            >
              Clear all
            </Button>
          )}
        </MenuItem>

        {pins.length === 0 && (
          <MenuItem disabled sx={{ fontSize: 14, opacity: 0.7 }}>
            No notifications
          </MenuItem>
        )}

        {pins.map((pin) => (
          <MenuItem
            key={pin.id}
            onClick={handleClose}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              fontSize: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 500 }}>{pin.title}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                {new Date(pin.created_at).toLocaleString()}
              </span>
            </div>

            <IconButton size="small" onClick={(e) => handleClearOne(e, pin.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
