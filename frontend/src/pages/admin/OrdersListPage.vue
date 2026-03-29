<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";

const { t } = useI18n();
const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const search = ref("");
const statusFilter = ref(null);

const statuses = [
  { label: () => t('services.all_games'), value: null },
  { label: () => t('orders.status.pending'), value: "pending" },
  { label: () => t('orders.status.accepted'), value: "accepted" },
  { label: () => t('orders.status.payment_confirmed'), value: "payment_confirmed" },
  { label: () => t('orders.status.in_progress'), value: "in_progress" },
  { label: () => t('orders.status.completed'), value: "completed" },
  { label: () => t('orders.status.cancelled'), value: "cancelled" },
  { label: () => t('orders.status.rejected'), value: "rejected" },
];

const statusColors = { pending: "warn", accepted: "info", payment_confirmed: "info", in_progress: "help", completed: "success", cancelled: "danger", rejected: "danger" };

function statusLabel(status) {
  return t(`orders.status.${status}`) || status;
}

async function fetchOrders() {
  loading.value = true;
  try {
    const { data } = await api.get("/orders", { params: { search: search.value, status: statusFilter.value } });
    orders.value = data.data;
  } finally { loading.value = false; }
}

onMounted(fetchOrders);
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('orders.title') }}</h1>
    <div class="flex gap-3 mb-4 flex-wrap">
      <InputText v-model="search" :placeholder="t('common.search')" class="w-64" @input="fetchOrders" />
    </div>
    <!-- Empty state -->
    <div v-if="!loading && !orders.length" class="empty-state">
      <i class="pi pi-shopping-cart" />
      <p>{{ t('empty.orders_admin') }}</p>
    </div>

    <DataTable v-else :value="orders" :loading="loading" stripedRows class="rounded-xl overflow-hidden">
      <Column field="order_number" :header="t('orders.order_number')" sortable />
      <Column field="client_name" :header="t('orders.client')" sortable />
      <Column field="status" :header="t('common.status')">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusColors[data.status]" />
        </template>
      </Column>
      <Column field="total_price" :header="t('common.price')">
        <template #body="{ data }">${{ Number(data.total_price).toFixed(2) }}</template>
      </Column>
      <Column field="collaborator_name" :header="t('orders.assigned_to')" />
      <Column :header="t('common.actions')" style="width: 80px">
        <template #body="{ data }">
          <Button icon="pi pi-eye" text size="small" @click="router.push(`/admin/orders/${data.id}`)" />
        </template>
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
  font-size: 1rem;
  color: #64748b;
}
</style>
