import { supabase } from "../supabaseClient";

const PUBLIC_VAPID_KEY =
  "BKGdHJDnBcbf9fOn9LWXsBwdplAmfAvB6YRV-sYux-U0tnm8arDAcfdUDURC1-aFaYkI6uwmVfwJhxzLDEJRd6U";

// Ask user to enable notifications
export async function askPermission() {
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Registers a push subscription with the browser
export async function subscribeUser() {
  const registration = await navigator.serviceWorker.ready;

  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: PUBLIC_VAPID_KEY,
  });
}

export async function enablePushForUser(user) {
  const granted = await askPermission();
  if (!granted) {
    console.log("Permission denied");
    return;
  }

  // Subscribe user in the service worker
  const subscription = await subscribeUser();

  // Store subscription in Supabase
  await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      subscription,
    },
    { onConflict: "user_id" }
  );

  console.log("Push notifications enabled successfully!");
}
