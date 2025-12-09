self.addEventListener("install", () => {
  console.log("Service Worker installed");
});

self.addEventListener("activate", () => {
  console.log("Service Worker activated");
});

self.addEventListener("push", (event) => {
  console.log("PUSH EVENT FIRED!", event);

  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/slug_watch_logo_192x192.png",
    })
  );
});
