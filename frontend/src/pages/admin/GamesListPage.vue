<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const games = ref([]);
const loading = ref(true);
const search = ref("");

async function fetchGames() {
  loading.value = true;
  try {
    const { data } = await api.get("/catalog/games", { params: { search: search.value } });
    games.value = data.data;
  } finally { loading.value = false; }
}

async function deleteGame(id) {
  await api.delete(`/catalog/games/${id}`);
  toast.add({ severity: "success", summary: t("common.delete"), life: 3000 });
  fetchGames();
}

onMounted(fetchGames);
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('games.title') }}</h1>
      <Button :label="t('games.add')" icon="pi pi-plus" severity="help" @click="router.push('/admin/games/create')" />
    </div>
    <div class="mb-4">
      <InputText v-model="search" :placeholder="t('games.search_games')" class="w-full max-w-sm" @input="fetchGames" />
    </div>
    <!-- Empty state -->
    <div v-if="!loading && !games.length" class="empty-state">
      <i class="pi pi-th-large" />
      <p>{{ t('empty.games') }}</p>
      <Button :label="t('empty.games_cta')" icon="pi pi-plus" severity="help" @click="router.push('/admin/games/create')" />
    </div>

    <DataTable v-else :value="games" :loading="loading" stripedRows class="rounded-xl overflow-hidden">
      <Column field="name" :header="t('common.name')" sortable />
      <Column field="platforms" :header="t('games.platforms')">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Tag v-for="p in (data.platforms || '').split(',')" :key="p" :value="p" severity="info" class="text-xs" />
          </div>
        </template>
      </Column>
      <Column field="is_active" :header="t('common.status')">
        <template #body="{ data }">
          <Tag :value="data.is_active ? t('common.active') : t('common.inactive')" :severity="data.is_active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column :header="t('common.actions')" style="width: 150px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" text size="small" @click="router.push(`/admin/games/${data.id}/edit`)" />
            <Button icon="pi pi-trash" text severity="danger" size="small" @click="deleteGame(data.id)" />
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
