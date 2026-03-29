<script setup>
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store.js";
import { useGlobalSocket } from "@/composables/useGlobalSocket.js";
import Toast from "primevue/toast";

const auth = useAuthStore();

onMounted(async () => {
  await auth.initFromStorage();
  useGlobalSocket();

  // Request browser notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});
</script>

<template>
  <div class="dark min-h-screen bg-slate-950 text-slate-100">
    <Toast position="top-right" />
    <router-view />
  </div>
</template>
