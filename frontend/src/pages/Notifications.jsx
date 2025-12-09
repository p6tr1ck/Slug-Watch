import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import { Badge, IconButton } from "@mui/material";
import { useState, useContext, useEffect } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { supabase } from "../../supabaseClient";
import { AuthContext, DarkModeSwitch } from "../App";
import Box from "@mui/material/Box";
import useWindowDimensions from "../WindowDimensions";

export default function Notification() {
  const { session, setSelectedPinId } = useContext(AuthContext);
  const { theme } = useContext(DarkModeSwitch);

  const [pinId, setPinId] = useState([]);
  const [pins, setPins] = useState([]);
  const [adminMsgs, setAdminMsgs] = useState([]);

  const [pinUnread, setPinUnread] = useState(0);
  const [adminUnread, setAdminUnread] = useState(0);
  const unreadNotifications = pinUnread + adminUnread;

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const isMobile = window.innerWidth <= 600;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);

    async function readNotifications() {
      if (!session) return;

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

      setPinUnread(0);
    }

    readNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClearOne = (event, id) => {
    event.stopPropagation();

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

  const handleAdminRead = async () => {
    if (!session || adminMsgs.length === 0) return;

    const unread = adminMsgs.filter((m) => m.is_read === false).length;
    if (unread === 0) return;

    const { error } = await supabase
      .from("AdminMsg")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .eq("is_read", false);

    if (error) {
      console.log("error on marking admin read: ", error);
      return;
    }

    setAdminMsgs((prev) =>
      prev.map((m) => ({
        ...m,
        is_read: true,
      }))
    );
    setAdminUnread(0);
  };

  const handleClearAll = () => {
    async function deleteAllNotifications() {
      if (!session) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error deleting all notifications: ", error);
      }

      const { error: msgErr } = await supabase
        .from("AdminMsg")
        .delete()
        .eq("user_id", session.user.id);

      if (msgErr) {
        console.log("error deleting admin msgs: ", msgErr);
      }
    }

    deleteAllNotifications();
    setPins([]);
    setPinId([]);
    setAdminMsgs([]);
    setPinUnread(0);
    setAdminUnread(0);
  };

  // Enabling realtime notifications
  useEffect(() => {
    if (!session) return;

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

            if (userId === session.user.id) {
              setPinId((prev) => [...prev, newPinId]);
              setPinUnread((prev) => prev + 1);
            }

            const { data } = await supabase
              .from("example_pins")
              .select("*")
              .eq("id", newPinId)
              .single();

            const category = data?.category;
            const location = data?.location;
            console.log(category, location);

            // Fetch subscription for this user
            const { data: subs } = await supabase
              .from("push_subscriptions")
              .select("*")
              .eq("user_id", session.user.id);

            if (subs.length === 0) return;

            // Loop through the user’s subscriptions
            for (const s of subs) {
              await supabase.functions.invoke("sendNotification", {
                body: {
                  subscription: s.subscription,
                  title: "New Safety Alert!",
                  body: `A ${
                    category ? `${category} pin` : "pin"
                  } was recently created${
                    location ? ` near ${location}.` : "."
                  }`,
                },
              });
            }
          }

          handleInsert();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    async function getNotifications() {
      if (!session) return;

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
        const unread = data.filter((d) => d.is_read === false).length;
        setPinUnread(unread);
      }
    }

    getNotifications();
  }, [session?.user?.id]);

  useEffect(() => {
    async function getPins() {
      if (pinId && pinId.length > 0) {
        for (const id of pinId) {
          const { data, error } = await supabase
            .from("example_pins")
            .select("*")
            .eq("id", id)
            .single();

          if (data === null || data.length === 0) {
            console.log("No pin found");
            return;
          }

          if (error) {
            console.log("Error loading pins: ", error);
          } else {
            setPins((prev) => {
              if (prev.some((p) => p.id === data.id)) {
                return prev;
              }
              const updated = [...prev, data];

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

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("realtime:AdminMsg")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "AdminMsg",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const msg = payload.new;
          setAdminMsgs((prev) => [msg, ...prev]);
          setAdminUnread((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) return;

    async function getMsg() {
      const { data, error } = await supabase
        .from("AdminMsg")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) {
        console.log("error receiving msgs: ", error);
        return;
      }

      setAdminMsgs(data ?? []);

      const unread = (data ?? []).filter((m) => m.is_read === false).length;
      setAdminUnread(unread);
    }

    getMsg();
  }, [session?.user?.id]);

  const anyNotifs = pins.length > 0 || adminMsgs.length > 0;

  return (
    <div>
      <Button
        id="notifications-button"
        aria-controls={open ? "notifications-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        color="inherit"
        sx={{
          minWidth: 0,
          padding: 0,
          lineHeight: 1,
        }}
      >
        <Badge
          color="secondary"
          badgeContent={unreadNotifications}
          overlap="circular"
        >
          <NotificationsIcon
            sx={{
              color: theme === "light" ? "black" : "white",
            }}
          />
        </Badge>
      </Button>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={
          isMobile
            ? { vertical: "top", horizontal: "center" }
            : { vertical: "bottom", horizontal: "center" }
        }
        transformOrigin={
          isMobile
            ? { vertical: "bottom", horizontal: "center" }
            : { vertical: "top", horizontal: "center" }
        }
        slotProps={{
          list: {
            "aria-labelledby": "notifications-button",
            sx: { p: 0 },
          },
        }}
        PaperProps={{
          sx: {
            minWidth: 260,
            maxWidth: 400,
            maxHeight: 400,
            overflow: "hidden",
          },
        }}
      >
        <MenuItem
          disabled={!anyNotifs}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600,
            fontSize: 14,
            opacity: 1,
          }}
        >
          <span>Notifications</span>
          <div style={{ display: "flex", gap: 4 }}>
            {adminMsgs.length > 0 && (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdminRead();
                }}
              >
                Mark admin read
              </Button>
            )}
            {anyNotifs && (
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
          </div>
        </MenuItem>

        <Box
          sx={{
            maxHeight: 340,
            overflowY: "auto",
          }}
        >
          {!anyNotifs && (
            <MenuItem disabled sx={{ fontSize: 14, opacity: 0.7 }}>
              No notifications
            </MenuItem>
          )}

          {adminMsgs.map((msg) => (
            <MenuItem
              key={msg.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.5,
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 600 }}>Moderator message</span>
              <span style={{ fontSize: 13 }}>{msg.description}</span>
              {msg.created_at && (
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              )}
            </MenuItem>
          ))}

          {pins.map((pin) => (
            <MenuItem
              key={pin.id}
              onClick={() => {
                handleClose();
                setSelectedPinId(pin.id);
              }}
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

              <IconButton
                size="small"
                onClick={(e) => handleClearOne(e, pin.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </div>
  );
}
