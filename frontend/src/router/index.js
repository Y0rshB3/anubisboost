import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import clientRoutes from "./routes/client.routes.js";
import collaboratorRoutes from "./routes/collaborator.routes.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [...publicRoutes, ...adminRoutes, ...clientRoutes, ...collaboratorRoutes],
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  // Init from storage on first load
  if (!auth.user && localStorage.getItem("access_token")) {
    await auth.fetchProfile();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) return next("/login");
  if (to.meta.guest && auth.isAuthenticated) return next(getHomeRoute(auth.user.role));
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) return next(getHomeRoute(auth.user?.role));

  next();
});

function getHomeRoute(role) {
  if (role === "admin") return "/admin";
  if (role === "collaborator") return "/collaborator";
  return "/client";
}

export default router;
