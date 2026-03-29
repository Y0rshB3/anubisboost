<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const service = ref(null);
const loading = ref(true);
const desiredResult = ref("");
const ordering = ref(false);

onMounted(async () => {
  try { const { data } = await api.get(`/catalog/services/${route.params.id}`); service.value = data.data; } finally { loading.value = false; }
});

async function placeOrder() {
  ordering.value = true;
  try {
    await api.post("/orders", { serviceId: service.value.id, desiredResult: desiredResult.value });
    toast.add({ severity: "success", summary: t("services.submit_order"), life: 3000 });
    router.push("/client/orders");
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error al crear pedido", life: 5000 });
  } finally { ordering.value = false; }
}
</script>

<template>
  <div v-if="loading" class="text-slate-400">{{ t('common.loading') }}</div>
  <div v-else-if="service" class="max-w-3xl">
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold">{{ service.name }}</h1>
          <div class="flex gap-2 mt-2">
            <Tag :value="service.game_name" severity="info" />
            <Tag :value="service.platform_name" />
            <Tag :value="service.type_name" severity="secondary" />
          </div>
        </div>
        <span class="text-3xl font-bold text-brand-400">${{ Number(service.base_price).toFixed(2) }}</span>
      </div>
      <p v-if="service.description" class="text-slate-400 mt-4">{{ service.description }}</p>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-6">
      <h2 class="font-bold mb-4">{{ t('services.place_order') }}</h2>
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-1">{{ t('services.describe_goal') }}</label>
        <Textarea v-model="desiredResult" rows="3" class="w-full" :placeholder="t('services.goal_placeholder')" />
      </div>
      <Button :label="t('services.submit_order')" severity="help" :loading="ordering" @click="placeOrder" class="w-full" />
    </div>
  </div>
</template>
