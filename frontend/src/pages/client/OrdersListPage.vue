<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";

const { t } = useI18n();
const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const statusColors = { pending: "warn", accepted: "info", payment_confirmed: "info", in_progress: "help", completed: "success", cancelled: "danger", rejected: "danger" };

onMounted(async () => {
  try { const { data } = await api.get("/orders"); orders.value = data.data; } finally { loading.value = false; }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('orders.my_orders') }}</h1>
    <!-- Empty state -->
    <div v-if="!loading && !orders.length" class="empty-state">
      <i class="pi pi-shopping-cart" />
      <p>{{ t('empty.orders_client') }}</p>
      <Button :label="t('empty.orders_client_cta')" icon="pi pi-search" severity="help" @click="router.push('/client/catalog')" />
    </div>

    <DataTable v-else :value="orders" :loading="loading" stripedRows class="rounded-xl overflow-hidden">
      <Column field="order_number" :header="t('orders.order_number')" />
      <Column field="status" :header="t('common.status')">
        <template #body="{ data }"><Tag :value="t(`orders.status.${data.status}`)" :severity="statusColors[data.status]" /></template>
      </Column>
      <Column field="total_price" :header="t('common.price')">
        <template #body="{ data }">${{ Number(data.total_price).toFixed(2) }}</template>
      </Column>
      <Column field="created_at" :header="t('common.date')">
        <template #body="{ data }">{{ new Date(data.created_at).toLocaleDateString() }}</template>
      </Column>
      <Column :header="t('common.actions')" style="width: 80px">
        <template #body="{ data }"><Button icon="pi pi-eye" text size="small" @click="router.push(`/client/orders/${data.id}`)" /></template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #475569;
}
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}
.empty-state p {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #64748b;
}
</style>
