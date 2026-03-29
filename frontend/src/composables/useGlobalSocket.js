import { watch } from "vue";
import { createSocket } from "@/config/socket.config.js";
import { useAuthStore } from "@/stores/auth.store.js";
import { useNotificationStore } from "@/stores/notification.store.js";
import router from "@/router/index.js";

let notifSocket = null;

export function useGlobalSocket() {
  const auth = useAuthStore();
  const notifs = useNotificationStore();

  function connect() {
    if (notifSocket) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    notifSocket = createSocket("/notifications", token);
    notifSocket.connect();

    notifSocket.on("notification:new", (notification) => {
      notifs.addNotification(notification);
      showBrowserNotification(notification);
    });

    notifSocket.on("connect_error", () => {
      // Silently retry
    });

    notifs.fetch();
  }

  function disconnect() {
    if (notifSocket) {
      notifSocket.disconnect();
      notifSocket = null;
    }
  }

  function showBrowserNotification(notification) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const n = new Notification(notification.title, {
        body: notification.body || "",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `notif-${notification.id}`,
      });

      // Click on browser notification → navigate to relevant page
      n.onclick = () => {
        window.focus();
        const route = notifs.resolveRoute(notification, auth.user?.role);
        if (route) router.push(route);
        n.close();
      };
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }

  watch(
    () => auth.isAuthenticated,
    (isAuth) => {
      if (isAuth) connect();
      else disconnect();
    },
    { immediate: true }
  );

  return { connect, disconnect };
}
