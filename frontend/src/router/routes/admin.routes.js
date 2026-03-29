import AdminLayout from "@/layouts/AdminLayout.vue";

export default [
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ["admin"] },
    children: [
      { path: "", name: "admin-dashboard", component: () => import("@/pages/admin/DashboardPage.vue") },
      { path: "platforms", name: "admin-platforms", component: () => import("@/pages/admin/PlatformsListPage.vue") },
      { path: "games", name: "admin-games", component: () => import("@/pages/admin/GamesListPage.vue") },
      { path: "games/create", name: "admin-game-create", component: () => import("@/pages/admin/GameFormPage.vue") },
      { path: "games/:id/edit", name: "admin-game-edit", component: () => import("@/pages/admin/GameFormPage.vue") },
      { path: "services", name: "admin-services", component: () => import("@/pages/admin/ServicesListPage.vue") },
      { path: "services/create", name: "admin-service-create", component: () => import("@/pages/admin/ServiceFormPage.vue") },
      { path: "services/:id/edit", name: "admin-service-edit", component: () => import("@/pages/admin/ServiceFormPage.vue") },
      { path: "orders", name: "admin-orders", component: () => import("@/pages/admin/OrdersListPage.vue") },
      { path: "orders/:id", name: "admin-order-detail", component: () => import("@/pages/admin/OrderDetailPage.vue") },
      { path: "collaborators", name: "admin-collaborators", component: () => import("@/pages/admin/CollaboratorsListPage.vue") },
      { path: "users", name: "admin-users", component: () => import("@/pages/admin/UsersManagePage.vue") },
      { path: "faq", name: "admin-faq-manage", component: () => import("@/pages/admin/FaqManagePage.vue") },
      { path: "guide", name: "admin-guide", component: () => import("@/pages/admin/AdminGuidePage.vue") },
      { path: "api-docs", name: "admin-api-docs", component: () => import("@/pages/admin/ApiDocsPage.vue") },
      { path: "notifications", name: "admin-notifications", component: () => import("@/pages/client/NotificationsPage.vue") },
      { path: "profile", name: "admin-profile", component: () => import("@/pages/shared/ProfilePage.vue") },
    ],
  },
];
