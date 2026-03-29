<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";

const { t, te } = useI18n();
const router = useRouter();
const services = ref([]);
const games = ref([]);
const platforms = ref([]);
const loading = ref(true);
const search = ref("");
const gameFilter = ref(null);
const platformFilter = ref(null);

async function fetchServices() {
  loading.value = true;
  try {
    const { data } = await api.get("/catalog/services", { params: { search: search.value, game_id: gameFilter.value, platform_id: platformFilter.value } });
    services.value = data.data;
  } finally { loading.value = false; }
}

onMounted(async () => {
  const [g, p] = await Promise.all([api.get("/catalog/games"), api.get("/catalog/platforms")]);
  games.value = [{ label: t("services.all_games"), value: null }, ...g.data.data.map((x) => ({ label: x.name, value: x.id }))];
  platforms.value = [{ label: t("services.all_platforms"), value: null }, ...p.data.data.map((x) => ({
    label: te(`platform_names.${x.slug}`) ? t(`platform_names.${x.slug}`) : x.name, value: x.id,
  }))];
  fetchServices();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('services.catalog_title') }}</h1>
    <div class="flex gap-3 mb-6 flex-wrap">
      <InputText v-model="search" :placeholder="t('services.search_services')" class="w-64" @input="fetchServices" />
      <Select v-model="gameFilter" :options="games" optionLabel="label" optionValue="value" :placeholder="t('services.game')" class="w-48" @change="fetchServices" />
      <Select v-model="platformFilter" :options="platforms" optionLabel="label" optionValue="value" :placeholder="t('services.platform')" class="w-48" @change="fetchServices" />
    </div>
    <div v-if="loading" class="skeleton-catalog">
      <div v-for="n in 6" :key="n" class="skeleton-card-cat">
        <div class="skeleton-cover" />
        <div class="skeleton-body">
          <div class="skeleton-line" style="width:70%;height:14px" />
          <div class="skeleton-line" style="width:45%;height:12px" />
          <div class="skeleton-row-cat">
            <div class="skeleton-line" style="width:50px;height:16px" />
            <div class="skeleton-line" style="width:60px;height:22px;border-radius:999px" />
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!services.length" class="text-center text-slate-500 py-12">
      <i class="pi pi-search text-4xl mb-3 block" />
      <p>{{ t('services.no_services') }}</p>
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in services" :key="s.id" @click="router.push(`/client/catalog/${s.id}`)" class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-brand-500/50 transition cursor-pointer">
        <div class="h-32 bg-gradient-to-br from-brand-900/40 to-slate-800 flex items-center justify-center">
          <img v-if="s.game_cover" :src="s.game_cover" :alt="s.game_name" class="h-full w-full object-cover" />
          <i v-else class="pi pi-image text-4xl text-slate-600" />
        </div>
        <div class="p-4">
          <h3 class="font-bold text-sm">{{ s.name }}</h3>
          <p class="text-slate-400 text-xs mt-1">{{ s.game_name }}</p>
          <div class="flex items-center justify-between mt-3">
            <span class="text-brand-400 font-bold">${{ Number(s.base_price).toFixed(2) }}</span>
            <Tag :value="s.platform_name" severity="info" class="text-xs" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.skeleton-card-cat {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem;
  overflow: hidden;
}
.skeleton-cover {
  height: 128px;
  background: rgba(30, 41, 59, 0.5);
  animation: shimmer 1.5s infinite ease-in-out;
}
.skeleton-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.skeleton-row-cat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
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
