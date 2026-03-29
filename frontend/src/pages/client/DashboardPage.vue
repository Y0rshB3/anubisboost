<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import Button from "primevue/button";
import Tag from "primevue/tag";

const { t } = useI18n();
const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const statusColors = { pending: "warn", accepted: "info", payment_confirmed: "info", in_progress: "help", completed: "success", cancelled: "danger", rejected: "danger" };

onMounted(async () => {
  try { const { data } = await api.get("/orders", { params: { limit: 5 } }); orders.value = data.data; } finally { loading.value = false; }
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('dashboard.title') }}</h1>
      <Button :label="t('dashboard.browse_services')" icon="pi pi-search" severity="help" @click="router.push('/client/catalog')" />
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 class="font-bold mb-4">{{ t('dashboard.recent_orders') }}</h2>
      <div v-if="loading" class="skeleton-list">
        <div v-for="n in 3" :key="n" class="skeleton-row">
          <div class="skeleton-col">
            <div class="skeleton-line" style="width:40%;height:14px" />
            <div class="skeleton-line" style="width:25%;height:12px" />
          </div>
          <div class="skeleton-line" style="width:70px;height:24px;border-radius:999px" />
        </div>
      </div>
      <div v-else-if="!orders.length" class="text-slate-500 text-center py-8">
        <i class="pi pi-shopping-cart text-4xl mb-3 block" />
        <p>{{ t('dashboard.no_orders') }}</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="o in orders" :key="o.id" @click="router.push(`/client/orders/${o.id}`)" class="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition">
          <div>
            <p class="font-medium">{{ o.order_number }}</p>
            <p class="text-sm text-slate-400">${{ Number(o.total_price).toFixed(2) }}</p>
          </div>
          <Tag :value="t(`orders.status.${o.status}`)" :severity="statusColors[o.status]" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.skeleton-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(30, 41, 59, 0.3);
}
.skeleton-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.skeleton-line {
  background: rgba(71, 85, 105, 0.25);
  border-radius: 0.375rem;
  animation: shimmer 1.5s infinite ease-in-out;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
