<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import TheSidebar from "@/components/layout/TheSidebar.vue";
import TheTopbar from "@/components/layout/TheTopbar.vue";
import OnboardingTour from "@/components/common/OnboardingTour.vue";

const { t } = useI18n();
const sidebarOpen = ref(true);
const menuItems = computed(() => [
  { label: t("nav.dashboard"), icon: "pi pi-home", to: "/collaborator" },
  { label: t("nav.assigned_orders"), icon: "pi pi-list", to: "/collaborator/orders" },
]);

const tourSteps = computed(() => [
  { target: '[data-tour="tour-collaborator"]', title: t("tour.collaborator.dashboard_title"), description: t("tour.collaborator.dashboard_desc"), position: "right" },
  { target: '[data-tour="tour-collaborator-orders"]', title: t("tour.collaborator.orders_title"), description: t("tour.collaborator.orders_desc"), position: "right" },
]);
</script>

<template>
  <div class="layout-wrapper">
    <TheSidebar :items="menuItems" :open="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />
    <div class="layout-main">
      <TheTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout-content"><router-view /></main>
    </div>
    <OnboardingTour :steps="tourSteps" storage-key="onboarding_collaborator_done" />
  </div>
</template>

<style scoped>
.layout-wrapper { display: flex; height: 100vh; overflow: hidden; }
.layout-main { display: flex; flex: 1; flex-direction: column; overflow: hidden; }
.layout-content { flex: 1; overflow-y: auto; padding: 1.5rem; background: #0a0a1a; }
</style>
