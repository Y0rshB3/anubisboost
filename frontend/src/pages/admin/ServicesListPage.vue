<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const services = ref([]);
const loading = ref(true);

async function fetchServices() {
  loading.value = true;
  try {
    const { data } = await api.get("/catalog/services");
    services.value = data.data;
  } finally { loading.value = false; }
}

async function deleteService(id) {
  await api.delete(`/catalog/services/${id}`);
  toast.add({ severity: "success", summary: t("common.delete"), life: 3000 });
  fetchServices();
}

onMounted(fetchServices);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('services.title') }}</h1>
      <Button :label="t('services.add')" icon="pi pi-plus" severity="help" @click="router.push('/admin/services/create')" />
    </div>
    <!-- Empty state -->
    <div v-if="!loading && !services.length" class="empty-state">
      <i class="pi pi-box" />
      <p>{{ t('empty.services') }}</p>
      <Button :label="t('empty.services_cta')" icon="pi pi-plus" severity="help" @click="router.push('/admin/services/create')" />
    </div>

    <DataTable v-else :value="services" :loading="loading" stripedRows class="rounded-xl overflow-hidden">
      <Column field="name" :header="t('common.name')" sortable />
      <Column field="game_name" :header="t('services.game')" sortable />
      <Column field="platform_name" :header="t('services.platform')" />
      <Column field="type_name" :header="t('services.type')" />
      <Column field="base_price" :header="t('common.price')">
        <template #body="{ data }">${{ Number(data.base_price).toFixed(2) }}</template>
      </Column>
      <Column :header="t('common.actions')" style="width: 150px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" text size="small" @click="router.push(`/admin/services/${data.id}/edit`)" />
            <Button icon="pi pi-trash" text severity="danger" size="small" @click="deleteService(data.id)" />
          </div>
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
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #64748b;
}
</style>
