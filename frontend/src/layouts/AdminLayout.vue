<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import TheSidebar from "@/components/layout/TheSidebar.vue";
import TheTopbar from "@/components/layout/TheTopbar.vue";
import OnboardingTour from "@/components/common/OnboardingTour.vue";

const { t } = useI18n();
const sidebarOpen = ref(true);
const menuItems = computed(() => [
  { label: t("nav.dashboard"), icon: "pi pi-chart-bar", to: "/admin" },
  { label: t("nav.platforms"), icon: "pi pi-desktop", to: "/admin/platforms" },
  { label: t("nav.games"), icon: "pi pi-th-large", to: "/admin/games" },
  { label: t("nav.services"), icon: "pi pi-box", to: "/admin/services" },
  { label: t("nav.orders"), icon: "pi pi-shopping-cart", to: "/admin/orders" },
  { label: t("nav.collaborators"), icon: "pi pi-users", to: "/admin/collaborators" },
  { label: t("users_admin.title"), icon: "pi pi-shield", to: "/admin/users" },
  { label: t("faq.manage"), icon: "pi pi-question-circle", to: "/admin/faq" },
  { label: t("faq.admin_guide"), icon: "pi pi-book", to: "/admin/guide" },
  { label: "API Docs", icon: "pi pi-code", to: "/admin/api-docs" },
]);

const tourSteps = computed(() => [
  { target: '[data-tour="tour-admin"]', title: t("tour.admin.dashboard_title"), description: t("tour.admin.dashboard_desc"), position: "right" },
  { target: '[data-tour="tour-admin-platforms"]', title: t("tour.admin.platforms_title"), description: t("tour.admin.platforms_desc"), position: "right" },
  { target: '[data-tour="tour-admin-games"]', title: t("tour.admin.games_title"), description: t("tour.admin.games_desc"), position: "right" },
  { target: '[data-tour="tour-admin-services"]', title: t("tour.admin.services_title"), description: t("tour.admin.services_desc"), position: "right" },
  { target: '[data-tour="tour-admin-orders"]', title: t("tour.admin.orders_title"), description: t("tour.admin.orders_desc"), position: "right" },
  { target: '[data-tour="tour-admin-collaborators"]', title: t("tour.admin.collaborators_title"), description: t("tour.admin.collaborators_desc"), position: "right" },
  { target: '[data-tour="tour-admin-users"]', title: t("tour.admin.users_title"), description: t("tour.admin.users_desc"), position: "right" },
]);
</script>

<template>
  <div class="layout-wrapper">
    <TheSidebar :items="menuItems" :open="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />
    <div class="layout-main">
      <TheTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout-content"><router-view /></main>
    </div>
    <OnboardingTour :steps="tourSteps" storage-key="onboarding_admin_done" />
  </div>
</template>

<style scoped>
.layout-wrapper { display: flex; height: 100vh; overflow: hidden; }
.layout-main { display: flex; flex: 1; flex-direction: column; overflow: hidden; }
.layout-content { flex: 1; overflow-y: auto; padding: 1.5rem; background: #0a0a1a; }
</style>
