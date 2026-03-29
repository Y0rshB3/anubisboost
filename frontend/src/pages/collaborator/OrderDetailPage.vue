<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import ChatWindow from "@/components/chat/ChatWindow.vue";

const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const order = ref(null);
const progress = ref([]);
const loading = ref(true);
const progressTitle = ref("");
const progressDesc = ref("");
const posting = ref(false);
const statusColors = { payment_confirmed: "info", in_progress: "help", completed: "success" };

async function fetchData() {
  const { data } = await api.get(`/orders/${route.params.id}`);
  order.value = data.data;
  const { data: p } = await api.get(`/orders/${route.params.id}/progress`);
  progress.value = p.data;
  loading.value = false;
}

async function postProgressUpdate() {
  posting.value = true;
  try {
    await api.post(`/orders/${route.params.id}/progress`, { title: progressTitle.value, description: progressDesc.value });
    toast.add({ severity: "success", summary: t("orders.post_progress"), life: 3000 });
    progressTitle.value = ""; progressDesc.value = "";
    fetchData();
  } finally { posting.value = false; }
}

async function doAction(action) {
  try {
    await api.patch(`/orders/${route.params.id}/${action}`);
    toast.add({ severity: "success", summary: t(`orders.${action}`), life: 3000 });
    fetchData();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  }
}

onMounted(fetchData);
</script>

<template>
  <nav v-if="order" class="breadcrumb">
    <router-link to="/collaborator/orders" class="breadcrumb-link">{{ t('breadcrumb.orders') }}</router-link>
    <i class="pi pi-angle-right breadcrumb-sep" />
    <span class="breadcrumb-current">{{ order.order_number }}</span>
  </nav>

  <div v-if="loading" class="text-slate-400">{{ t('common.loading') }}</div>
  <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold">{{ order.order_number }}</h1>
          <Tag :value="t(`orders.status.${order.status}`)" :severity="statusColors[order.status] || 'info'" />
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-slate-400">{{ t('orders.client') }}:</span> {{ order.client_name }}</div>
          <div><span class="text-slate-400">{{ t('common.price') }}:</span> ${{ Number(order.total_price).toFixed(2) }}</div>
          <div v-if="order.desired_result" class="col-span-2"><span class="text-slate-400">{{ t('orders.goal') }}:</span> {{ order.desired_result }}</div>
        </div>
        <div class="flex gap-2 mt-4">
          <Button v-if="order.status === 'payment_confirmed'" :label="t('orders.start_work')" severity="help" size="small" @click="doAction('start')" />
          <Button v-if="order.status === 'in_progress'" :label="t('orders.mark_complete')" severity="success" size="small" @click="doAction('complete')" />
        </div>
      </div>
      <div v-if="order.status === 'in_progress'" class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="font-bold mb-4">{{ t('orders.post_progress') }}</h2>
        <form @submit.prevent="postProgressUpdate" class="space-y-3">
          <InputText v-model="progressTitle" :placeholder="t('orders.progress_title')" class="w-full" required />
          <Textarea v-model="progressDesc" :placeholder="t('orders.progress_details')" rows="2" class="w-full" />
          <Button type="submit" :label="t('orders.post_progress')" :loading="posting" severity="help" size="small" />
        </form>
      </div>
      <div v-if="progress.length" class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="font-bold mb-4">{{ t('orders.progress') }}</h2>
        <div v-for="p in progress" :key="p.id" class="mb-3 border-l-2 border-brand-500 pl-4">
          <p class="font-medium">{{ p.title }}</p>
          <p v-if="p.description" class="text-sm text-slate-400">{{ p.description }}</p>
          <p class="text-xs text-slate-500">{{ new Date(p.created_at).toLocaleString() }}</p>
        </div>
      </div>
    </div>
    <div class="lg:col-span-1"><ChatWindow :orderId="String(order.id)" /></div>
  </div>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}
.breadcrumb-link {
  color: #7c3aed;
  text-decoration: none;
  transition: color 0.2s;
}
.breadcrumb-link:hover { color: #a78bfa; }
.breadcrumb-sep { color: #475569; font-size: 0.7rem; }
.breadcrumb-current { color: #94a3b8; }
</style>
