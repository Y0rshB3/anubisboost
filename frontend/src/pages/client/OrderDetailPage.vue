<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import Tag from "primevue/tag";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import ChatWindow from "@/components/chat/ChatWindow.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const order = ref(null);
const history = ref([]);
const progress = ref([]);
const loading = ref(true);
const proofUrl = ref(null);
const proofType = ref(null);
const uploading = ref(false);
const fileInput = ref(null);
const statusColors = { pending: "warn", accepted: "info", payment_confirmed: "info", in_progress: "help", completed: "success", cancelled: "danger", rejected: "danger" };
const showCancelConfirm = ref(false);

async function cancelOrder() {
  try {
    await api.patch(`/orders/${order.value.id}/cancel`, { reason: "Client cancelled" });
    toast.add({ severity: "success", summary: t("orders.cancel"), life: 3000 });
    showCancelConfirm.value = false;
    fetchOrder();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  }
}

async function fetchOrder() {
  const { data } = await api.get(`/orders/${route.params.id}`);
  order.value = data.data;
  const { data: h } = await api.get(`/orders/${route.params.id}/history`);
  history.value = h.data;
  const { data: p } = await api.get(`/orders/${route.params.id}/progress`);
  progress.value = p.data;
  // Fetch payment proof
  try {
    const { data: pp } = await api.get(`/orders/${route.params.id}/payment-proof`);
    proofUrl.value = pp.data.proof_url;
    proofType.value = pp.data.proof_type;
  } catch { /* no proof yet */ }
  loading.value = false;
}

async function handleProofUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data: upload } = await api.post("/upload/proof", formData, { headers: { "Content-Type": "multipart/form-data" } });

    await api.patch(`/orders/${route.params.id}/payment-proof`, {
      proof_url: upload.data.url,
      proof_type: upload.data.type,
    });
    proofUrl.value = upload.data.url;
    proofType.value = upload.data.type;
    toast.add({ severity: "success", summary: t("orders.proof_uploaded"), life: 3000 });
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

onMounted(fetchOrder);
</script>

<template>
  <!-- Cancel confirmation dialog -->
  <teleport to="body">
    <div v-if="showCancelConfirm" class="confirm-overlay" @click.self="showCancelConfirm = false">
      <div class="confirm-card">
        <div class="confirm-icon"><i class="pi pi-exclamation-triangle"></i></div>
        <h3>{{ t('orders.cancel') }}</h3>
        <p>{{ t('confirm.cancel_order') }}</p>
        <div class="confirm-actions">
          <button class="confirm-btn-cancel" @click="showCancelConfirm = false">{{ t('common.no') }}</button>
          <button class="confirm-btn-yes" @click="cancelOrder">{{ t('common.yes') }}, {{ t('orders.cancel') }}</button>
        </div>
      </div>
    </div>
  </teleport>

  <nav v-if="order" class="breadcrumb">
    <router-link to="/client/orders" class="breadcrumb-link">{{ t('breadcrumb.orders') }}</router-link>
    <i class="pi pi-angle-right breadcrumb-sep" />
    <span class="breadcrumb-current">{{ order.order_number }}</span>
  </nav>

  <div v-if="loading" class="text-slate-400">{{ t('common.loading') }}</div>
  <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <!-- Order info -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold">{{ order.order_number }}</h1>
          <Tag :value="t(`orders.status.${order.status}`)" :severity="statusColors[order.status]" />
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><span class="text-slate-400">{{ t('common.price') }}:</span> ${{ Number(order.total_price).toFixed(2) }}</div>
          <div><span class="text-slate-400">{{ t('orders.created') }}:</span> {{ new Date(order.created_at).toLocaleDateString() }}</div>
          <div v-if="order.desired_result" class="col-span-2"><span class="text-slate-400">{{ t('orders.goal') }}:</span> {{ order.desired_result }}</div>
        </div>
        <div class="flex flex-wrap gap-2 mt-4">
          <Button v-if="order.status === 'payment_confirmed' || order.status === 'in_progress'" :label="t('orders.upload_credentials')" icon="pi pi-lock" size="small" severity="help" @click="router.push(`/client/orders/${order.id}/credentials`)" />
          <Button v-if="['accepted','payment_confirmed'].includes(order.status) && order.contract_required !== false" :label="t('orders.sign_contract')" icon="pi pi-file" size="small" @click="router.push(`/client/orders/${order.id}/contract`)" />
          <Button v-if="order.status === 'pending'" :label="t('orders.cancel')" severity="danger" size="small" @click="showCancelConfirm = true" />
        </div>
      </div>

      <!-- Payment proof section (when accepted) -->
      <div v-if="['accepted', 'payment_confirmed', 'in_progress', 'completed'].includes(order.status)" class="proof-card">
        <div class="proof-header">
          <div class="proof-title">
            <i class="pi pi-receipt"></i>
            <h2>{{ t('orders.payment_proof') }}</h2>
          </div>
          <Tag v-if="proofUrl" :value="t('orders.proof_uploaded')" severity="success" class="text-xs" />
        </div>

        <!-- No proof uploaded yet -->
        <div v-if="!proofUrl && order.status === 'accepted'" class="proof-upload-area">
          <input ref="fileInput" type="file" accept="image/*,.pdf" hidden @change="handleProofUpload" />
          <div class="proof-dropzone" @click="fileInput?.click()">
            <i v-if="uploading" class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #a78bfa"></i>
            <template v-else>
              <i class="pi pi-cloud-upload" style="font-size: 2rem; color: #64748b"></i>
              <p class="proof-text">{{ t('orders.upload_proof_desc') }}</p>
              <span class="proof-hint">{{ t('orders.file_types') }}</span>
            </template>
          </div>
        </div>

        <!-- Proof preview -->
        <div v-else-if="proofUrl" class="proof-preview">
          <div v-if="proofType === 'pdf'" class="proof-pdf">
            <i class="pi pi-file-pdf" style="font-size: 2rem; color: #ef4444"></i>
            <a :href="proofUrl" target="_blank" class="proof-link">{{ t('orders.view_proof') }}</a>
          </div>
          <div v-else class="proof-image">
            <a :href="proofUrl" target="_blank">
              <img :src="proofUrl" alt="Payment proof" />
            </a>
          </div>
          <!-- Allow re-upload if still accepted -->
          <div v-if="order.status === 'accepted'" class="mt-3">
            <input ref="fileInput" type="file" accept="image/*,.pdf" hidden @change="handleProofUpload" />
            <Button :label="t('orders.upload_proof')" icon="pi pi-refresh" severity="secondary" size="small" :loading="uploading" @click="fileInput?.click()" />
          </div>
        </div>

        <div v-else class="text-slate-500 text-sm py-2">
          {{ t('orders.proof_uploaded') }}
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="font-bold mb-4">{{ t('orders.timeline') }}</h2>
        <div v-if="!history.length" class="text-slate-500 text-sm">{{ t('orders.no_history') }}</div>
        <div v-else class="space-y-3">
          <div v-for="h in history" :key="h.id" class="flex gap-3 text-sm">
            <div class="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
            <div>
              <span class="text-slate-300">{{ t(`orders.status.${h.to_status}`) }}</span>
              <div class="text-slate-500 text-xs">{{ new Date(h.created_at).toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress updates -->
      <div v-if="progress.length" class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="font-bold mb-4">{{ t('orders.progress_updates') }}</h2>
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
/* Breadcrumb */
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

.proof-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem; padding: 1.5rem;
}
.proof-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.proof-title { display: flex; align-items: center; gap: 0.5rem; }
.proof-title i { color: #a78bfa; }
.proof-title h2 { font-weight: 700; font-size: 1rem; margin: 0; }

.proof-dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 2rem; border: 2px dashed rgba(71, 85, 105, 0.4);
  border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; text-align: center;
}
.proof-dropzone:hover { border-color: #7c3aed; }
.proof-text { color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem; }
.proof-hint { color: #475569; font-size: 0.75rem; margin-top: 0.25rem; }

.proof-preview { }
.proof-image img { max-width: 100%; max-height: 300px; border-radius: 0.5rem; object-fit: contain; }
.proof-pdf {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 1rem; background: rgba(30, 41, 59, 0.5);
  border-radius: 0.5rem;
}
.proof-link { color: #a78bfa; text-decoration: none; font-weight: 500; }
.proof-link:hover { color: #c4b5fd; text-decoration: underline; }

/* Cancel confirm dialog */
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.confirm-card {
  background: #0f172a;
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.confirm-card h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.5rem;
}
.confirm-card p {
  color: #94a3b8;
  font-size: 0.875rem;
  margin: 0 0 1.5rem;
}
.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}
.confirm-btn-cancel {
  padding: 0.6rem 1.25rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 0.625rem;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
}
.confirm-btn-cancel:hover { background: rgba(30, 41, 59, 0.8); }
.confirm-btn-yes {
  padding: 0.6rem 1.25rem;
  background: #dc2626;
  border: none;
  border-radius: 0.625rem;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.confirm-btn-yes:hover { background: #b91c1c; }
</style>
