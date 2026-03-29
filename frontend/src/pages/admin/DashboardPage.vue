<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";

const { t } = useI18n();
const stats = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get("/admin/stats/dashboard");
    stats.value = data.data;
  } finally { loading.value = false; }
});

const statCards = [
  { key: "total_orders", i18n: "dashboard.total_orders", icon: "pi pi-shopping-cart", color: "text-blue-400" },
  { key: "pending", i18n: "dashboard.pending", icon: "pi pi-clock", color: "text-yellow-400" },
  { key: "in_progress", i18n: "dashboard.in_progress", icon: "pi pi-spin pi-spinner", color: "text-purple-400" },
  { key: "completed", i18n: "dashboard.completed", icon: "pi pi-check-circle", color: "text-green-400" },
  { key: "total_revenue", i18n: "dashboard.revenue", icon: "pi pi-dollar", color: "text-emerald-400", prefix: "$" },
  { key: "active_collaborators", i18n: "dashboard.collaborators", icon: "pi pi-users", color: "text-cyan-400" },
];
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('dashboard.title') }}</h1>
    <div v-if="loading" class="skeleton-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-sm" />
        <div class="skeleton-line skeleton-lg" />
      </div>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in statCards" :key="s.key" class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-slate-400 text-sm">{{ t(s.i18n) }}</p>
            <p class="text-3xl font-bold mt-1">{{ s.prefix || '' }}{{ stats?.[s.key] ?? 0 }}</p>
          </div>
          <i :class="[s.icon, s.color, 'text-3xl']" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.skeleton-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.skeleton-line {
  border-radius: 0.375rem;
  animation: shimmer 1.5s infinite ease-in-out;
}
.skeleton-sm {
  width: 50%;
  height: 14px;
  background: rgba(71, 85, 105, 0.25);
}
.skeleton-lg {
  width: 40%;
  height: 28px;
  background: rgba(71, 85, 105, 0.2);
}
@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
