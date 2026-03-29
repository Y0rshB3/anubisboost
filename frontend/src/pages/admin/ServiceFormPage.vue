<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const rawGames = ref([]);
const rawPlatforms = ref([]);
const rawServiceTypes = ref([]);

const games = computed(() => rawGames.value.map((x) => ({ label: x.name, value: x.id })));
const platforms = computed(() => rawPlatforms.value.map((x) => ({
  label: te(`platform_names.${x.slug}`) ? t(`platform_names.${x.slug}`) : x.name, value: x.id,
})));
const serviceTypes = computed(() => rawServiceTypes.value.map((x) => ({
  label: te(`service_types.${x.slug}`) ? t(`service_types.${x.slug}`) : x.name, value: x.id,
})));

const form = ref({ name: "", description: "", game_id: null, platform_id: null, service_type_id: null, base_price: 0, estimated_days: null });

onMounted(async () => {
  const [g, p, st] = await Promise.all([
    api.get("/catalog/games"), api.get("/catalog/platforms"), api.get("/catalog/service-types"),
  ]);
  rawGames.value = g.data.data;
  rawPlatforms.value = p.data.data;
  rawServiceTypes.value = st.data.data;

  if (isEdit.value) {
    const { data } = await api.get(`/catalog/services/${route.params.id}`);
    const s = data.data;
    form.value = { name: s.name, description: s.description || "", game_id: s.game_id, platform_id: s.platform_id,
      service_type_id: s.service_type_id, base_price: Number(s.base_price), estimated_days: s.estimated_days };
  }
});

async function save() {
  loading.value = true;
  try {
    if (isEdit.value) await api.patch(`/catalog/services/${route.params.id}`, form.value);
    else await api.post("/catalog/services", form.value);
    toast.add({ severity: "success", summary: isEdit.value ? t("common.update") : t("common.create"), life: 3000 });
    router.push("/admin/services");
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="max-w-2xl">
    <nav class="breadcrumb-nav">
      <router-link to="/admin/services" class="breadcrumb-link">{{ t('breadcrumb.services') }}</router-link>
      <i class="pi pi-angle-right breadcrumb-sep" />
      <span class="breadcrumb-current">{{ isEdit ? t('breadcrumb.edit_service') : t('breadcrumb.create_service') }}</span>
    </nav>
    <h1 class="text-2xl font-bold mb-6">{{ isEdit ? t('services.edit_service') : t('services.create_service') }}</h1>
    <form @submit.prevent="save" class="space-y-5">
      <div>
        <label class="block text-sm text-slate-400 mb-1">{{ t('common.name') }}</label>
        <InputText v-model="form.name" class="w-full" required />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('services.game') }}</label>
          <Select v-model="form.game_id" :options="games" optionLabel="label" optionValue="value" class="w-full" required />
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('services.platform') }}</label>
          <Select v-model="form.platform_id" :options="platforms" optionLabel="label" optionValue="value" class="w-full" required />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('services.type') }}</label>
          <Select v-model="form.service_type_id" :options="serviceTypes" optionLabel="label" optionValue="value" class="w-full" required />
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('services.base_price') }}</label>
          <InputNumber v-model="form.base_price" mode="currency" currency="USD" class="w-full" required />
        </div>
      </div>
      <div>
        <label class="block text-sm text-slate-400 mb-1">{{ t('common.description') }}</label>
        <Textarea v-model="form.description" rows="3" class="w-full" />
      </div>
      <div class="flex gap-3">
        <Button type="submit" :label="isEdit ? t('common.update') : t('common.create')" :loading="loading" severity="help" />
        <Button :label="t('common.cancel')" severity="secondary" @click="router.back()" />
      </div>
    </form>
  </div>
</template>

<style scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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
