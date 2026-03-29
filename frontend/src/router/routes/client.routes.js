import ClientLayout from "@/layouts/ClientLayout.vue";

export default [
  {
    path: "/client",
    component: ClientLayout,
    meta: { requiresAuth: true, roles: ["client"] },
    children: [
      { path: "", name: "client-dashboard", component: () => import("@/pages/client/DashboardPage.vue") },
      { path: "catalog", name: "client-catalog", component: () => import("@/pages/client/CatalogPage.vue") },
      { path: "catalog/:id", name: "client-service-detail", component: () => import("@/pages/client/ServiceDetailPage.vue") },
      { path: "orders", name: "client-orders", component: () => import("@/pages/client/OrdersListPage.vue") },
      { path: "orders/:id", name: "client-order-detail", component: () => import("@/pages/client/OrderDetailPage.vue") },
      { path: "orders/:id/credentials", name: "client-credentials", component: () => import("@/pages/client/CredentialsPage.vue") },
      { path: "orders/:id/contract", name: "client-contract", component: () => import("@/pages/client/ContractSignPage.vue") },
      { path: "faq", name: "client-faq", component: () => import("@/pages/client/FaqPage.vue") },
      { path: "notifications", name: "client-notifications", component: () => import("@/pages/client/NotificationsPage.vue") },
      { path: "profile", name: "client-profile", component: () => import("@/pages/shared/ProfilePage.vue") },
    ],
  },
];
