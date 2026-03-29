import CollaboratorLayout from "@/layouts/CollaboratorLayout.vue";

export default [
  {
    path: "/collaborator",
    component: CollaboratorLayout,
    meta: { requiresAuth: true, roles: ["collaborator"] },
    children: [
      { path: "", name: "collab-dashboard", component: () => import("@/pages/collaborator/DashboardPage.vue") },
      { path: "orders", name: "collab-orders", component: () => import("@/pages/collaborator/AssignedOrdersPage.vue") },
      { path: "orders/:id", name: "collab-order-detail", component: () => import("@/pages/collaborator/OrderDetailPage.vue") },
      { path: "notifications", name: "collab-notifications", component: () => import("@/pages/client/NotificationsPage.vue") },
      { path: "profile", name: "collab-profile", component: () => import("@/pages/shared/ProfilePage.vue") },
    ],
  },
];
