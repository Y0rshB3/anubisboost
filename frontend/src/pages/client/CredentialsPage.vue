<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const username = ref("");
const password = ref("");
const notes = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await api.post(`/orders/${route.params.id}/credentials`, { username: username.value, password: password.value, notes: notes.value });
    toast.add({ severity: "success", summary: t("credentials.submit"), life: 3000 });
    router.push(`/client/orders/${route.params.id}`);
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-2">{{ t('credentials.title') }}</h1>
    <p class="text-slate-400 text-sm mb-6">{{ t('credentials.subtitle') }}</p>
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <form @submit.prevent="submit" class="space-y-5">
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('credentials.game_username') }}</label>
          <InputText v-model="username" class="w-full" required />
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('credentials.game_password') }}</label>
          <Password v-model="password" :feedback="false" toggleMask class="w-full" inputClass="w-full" required />
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1">{{ t('credentials.additional_notes') }}</label>
          <Textarea v-model="notes" rows="3" class="w-full" />
        </div>
        <Button type="submit" :label="t('credentials.submit')" icon="pi pi-lock" :loading="loading" severity="help" class="w-full" />
      </form>
    </div>
  </div>
</template>
