<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import TheSidebar from "@/components/layout/TheSidebar.vue";
import TheTopbar from "@/components/layout/TheTopbar.vue";
import OnboardingTour from "@/components/common/OnboardingTour.vue";

const { t } = useI18n();
const sidebarOpen = ref(true);
const menuItems = computed(() => [
  { label: t("nav.dashboard"), icon: "pi pi-home", to: "/client" },
  { label: t("nav.catalog"), icon: "pi pi-search", to: "/client/catalog" },
  { label: t("nav.my_orders"), icon: "pi pi-shopping-cart", to: "/client/orders" },
  { label: t("faq.title"), icon: "pi pi-question-circle", to: "/client/faq" },
  { label: t("nav.notifications"), icon: "pi pi-bell", to: "/client/notifications" },
]);

const tourSteps = computed(() => [
  { target: '[data-tour="tour-client-catalog"]', title: t("tour.client.catalog_title"), description: t("tour.client.catalog_desc"), position: "right" },
  { target: '[data-tour="tour-client-orders"]', title: t("tour.client.orders_title"), description: t("tour.client.orders_desc"), position: "right" },
  { target: '[data-tour="tour-client-faq"]', title: t("tour.client.faq_title"), description: t("tour.client.faq_desc"), position: "right" },
  { target: '[data-tour="tour-client-notifications"]', title: t("tour.client.notifications_title"), description: t("tour.client.notifications_desc"), position: "right" },
]);
</script>

<template>
  <div class="layout-wrapper">
    <TheSidebar :items="menuItems" :open="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />
    <div class="layout-main">
      <TheTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="layout-content"><router-view /></main>
    </div>
    <OnboardingTour :steps="tourSteps" storage-key="onboarding_client_done" />
  </div>
</template>

<style scoped>
.layout-wrapper { display: flex; height: 100vh; overflow: hidden; }
.layout-main { display: flex; flex: 1; flex-direction: column; overflow: hidden; }
.layout-content { flex: 1; overflow-y: auto; padding: 1.5rem; background: #0a0a1a; }
</style>
