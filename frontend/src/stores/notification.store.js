import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/config/api.config.js";

export const useNotificationStore = defineStore("notifications", () => {
  const notifications = ref([]);
  const unreadCount = ref(0);
  const isLoading = ref(false);
  const toastCallback = ref(null);

  function setToastCallback(cb) {
    toastCallback.value = cb;
  }

  async function fetch(params = {}) {
    isLoading.value = true;
    try {
      const { data } = await api.get("/notifications", { params });
      notifications.value = data.data;
      unreadCount.value = data.unreadCount;
    } catch {
      // silently fail if not authenticated yet
    } finally {
      isLoading.value = false;
    }
  }

  function addNotification(n) {
    notifications.value.unshift(n);
    unreadCount.value++;

    if (toastCallback.value) {
      toastCallback.value({
        severity: "info",
        summary: n.title,
        detail: n.body || "",
        life: 5000,
      });
    }

    playNotificationSound();
  }

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }

  // Resolve the route path based on notification type and data
  function resolveRoute(notification, userRole) {
    const data = typeof notification.data === "string" ? JSON.parse(notification.data) : notification.data;
    const orderId = data?.orderId;
    if (!orderId) return null;

    const prefix = userRole === "admin" ? "/admin" : userRole === "collaborator" ? "/collaborator" : "/client";
    return `${prefix}/orders/${orderId}`;
  }

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    const n = notifications.value.find((x) => x.id === id);
    if (n && !n.read_at) {
      n.read_at = new Date();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    notifications.value.forEach((n) => (n.read_at = n.read_at || new Date()));
    unreadCount.value = 0;
  }

  async function remove(id) {
    await api.delete(`/notifications/${id}`);
    const idx = notifications.value.findIndex((x) => x.id === id);
    if (idx >= 0) {
      const n = notifications.value[idx];
      if (!n.read_at) unreadCount.value = Math.max(0, unreadCount.value - 1);
      notifications.value.splice(idx, 1);
    }
  }

  async function clearAll() {
    // Delete all one by one (backend doesn't have bulk delete)
    const ids = notifications.value.map((n) => n.id);
    await Promise.all(ids.map((id) => api.delete(`/notifications/${id}`).catch(() => {})));
    notifications.value = [];
    unreadCount.value = 0;
  }

  return {
    notifications, unreadCount, isLoading,
    fetch, addNotification, markRead, markAllRead, remove, clearAll,
    setToastCallback, resolveRoute,
  };
});
