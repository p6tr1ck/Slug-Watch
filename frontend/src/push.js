export async function askPermission() {
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeUser(publicKey) {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: publicKey,
  });

  return subscription;
}
