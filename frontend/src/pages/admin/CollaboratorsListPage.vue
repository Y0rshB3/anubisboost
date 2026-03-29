<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const toast = useToast();
const users = ref([]);
const loading = ref(true);

async function fetch() {
  loading.value = true;
  try {
    const { data } = await api.get("/users", { params: { role: "collaborator", limit: 100 } });
    users.value = data.data;
  } finally { loading.value = false; }
}

async function toggleStatus(user) {
  await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
  toast.add({ severity: "success", summary: user.is_active ? t("collaborators.deactivate") : t("collaborators.activate"), life: 3000 });
  fetch();
}

onMounted(fetch);
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('collaborators.title') }}</h1>
    <DataTable :value="users" :loading="loading" stripedRows class="rounded-xl overflow-hidden">
      <Column field="username" :header="t('collaborators.username')" sortable />
      <Column field="email" :header="t('collaborators.email')" sortable />
      <Column field="is_active" :header="t('common.status')">
        <template #body="{ data }">
          <Tag :value="data.is_active ? t('common.active') : t('common.inactive')" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column :header="t('common.actions')" style="width: 120px">
        <template #body="{ data }">
          <Button :label="data.is_active ? t('collaborators.deactivate') : t('collaborators.activate')" :severity="data.is_active ? 'danger' : 'success'" size="small" @click="toggleStatus(data)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
