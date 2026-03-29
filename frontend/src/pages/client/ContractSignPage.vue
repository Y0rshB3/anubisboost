<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const contract = ref(null);
const order = ref(null);
const loading = ref(true);
const signing = ref(false);
const agreed = ref(false);
const disputing = ref(false);
const showDispute = ref(false);
const disputeReason = ref("");

const statusColors = { draft: "warn", pending_client: "info", pending_admin: "warn", fully_signed: "success", voided: "danger", disputed: "warn", skipped: "secondary" };
const contractNotRequired = computed(() => order.value && !order.value.contract_required);

onMounted(async () => {
  try {
    const { data: o } = await api.get(`/orders/${route.params.id}`);
    order.value = o.data;
    const { data: c } = await api.get(`/orders/${route.params.id}/contract`);
    contract.value = c.data;
  } catch { contract.value = null; }
  finally { loading.value = false; }
});

async function sign() {
  signing.value = true;
  try {
    await api.post(`/orders/${route.params.id}/contract/sign/client`, { consent_text: t("contracts.agree_terms") });
    toast.add({ severity: "success", summary: t("contracts.sign"), life: 3000 });
    router.push(`/client/orders/${route.params.id}`);
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { signing.value = false; }
}

async function submitDispute() {
  if (!disputeReason.value.trim()) return;
  disputing.value = true;
  try {
    await api.post(`/orders/${route.params.id}/contract/dispute`, { reason: disputeReason.value });
    toast.add({ severity: "success", summary: t("contracts.dispute_sent"), life: 3000 });
    const { data: c } = await api.get(`/orders/${route.params.id}/contract`);
    contract.value = c.data;
    showDispute.value = false;
    disputeReason.value = "";
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { disputing.value = false; }
}
</script>

<template>
  <div class="contract-page">
    <h1>{{ t('contracts.title') }}</h1>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <!-- Contract not required (skipped) -->
    <div v-else-if="contractNotRequired" class="info-card">
      <i class="pi pi-info-circle"></i>
      <p>{{ t('contracts.not_required') }}</p>
    </div>

    <!-- No contract created yet -->
    <div v-else-if="!contract" class="info-card">
      <i class="pi pi-clock"></i>
      <p>{{ t('contracts.pending_creation') }}</p>
    </div>

    <!-- Contract exists -->
    <div v-else>
      <!-- Status banner -->
      <div class="status-bar" :class="contract.status">
        <span class="status-tag" :class="contract.status">{{ t(`contracts.status.${contract.status}`) }}</span>
        <span v-if="contract.status === 'disputed'" class="status-detail">{{ contract.dispute_reason }}</span>
      </div>

      <!-- Contract content -->
      <div class="contract-card">
        <h2>{{ t('contracts.agreement') }}</h2>
        <div class="contract-html" v-html="contract.content_html" />
      </div>

      <!-- Already signed -->
      <div v-if="contract.client_signed_at" class="signed-card">
        <i class="pi pi-check-circle"></i>
        <p>{{ t('contracts.signed_on') }} {{ new Date(contract.client_signed_at).toLocaleString() }}</p>
      </div>

      <!-- Skipped -->
      <div v-else-if="contract.status === 'skipped'" class="info-card">
        <i class="pi pi-forward"></i>
        <p>{{ t('contracts.skipped') }}</p>
      </div>

      <!-- Pending client signature -->
      <div v-else-if="contract.status === 'pending_client' || contract.status === 'pending_admin'" class="action-card">
        <!-- Sign -->
        <div class="sign-section">
          <label class="agree-row">
            <input type="checkbox" v-model="agreed" />
            <span>{{ t('contracts.agree_terms') }}</span>
          </label>
          <button class="btn-primary" :disabled="!agreed || signing" @click="sign">
            <i v-if="signing" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-check"></i>
            {{ t('contracts.sign') }}
          </button>
        </div>

        <!-- Dispute option -->
        <div class="dispute-section">
          <button v-if="!showDispute" class="btn-text" @click="showDispute = true">
            <i class="pi pi-exclamation-circle"></i> {{ t('contracts.dispute') }}
          </button>
          <div v-else class="dispute-form">
            <label>{{ t('contracts.dispute_reason') }}</label>
            <textarea v-model="disputeReason" rows="3" :placeholder="t('contracts.dispute_placeholder')"></textarea>
            <div class="dispute-actions">
              <button class="btn-secondary" @click="showDispute = false">{{ t('common.cancel') }}</button>
              <button class="btn-warn" :disabled="!disputeReason.trim() || disputing" @click="submitDispute">
                <i v-if="disputing" class="pi pi-spin pi-spinner"></i>
                {{ t('contracts.dispute') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Disputed (waiting for admin to edit) -->
      <div v-else-if="contract.status === 'disputed'" class="info-card disputed">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ t('contracts.disputed') }}</p>
        <p class="dispute-detail">"{{ contract.dispute_reason }}"</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contract-page { max-width: 800px; color: #f1f5f9; }
.contract-page h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }
.loading { color: #64748b; }

.info-card { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem 2rem; background: rgba(15,23,42,0.6); border: 1px solid rgba(71,85,105,0.2); border-radius: 0.875rem; text-align: center; color: #64748b; }
.info-card i { font-size: 2.5rem; }
.info-card.disputed { border-color: rgba(245,158,11,0.3); color: #fbbf24; }
.dispute-detail { color: #94a3b8; font-style: italic; font-size: 0.85rem; }

.status-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.625rem; margin-bottom: 1rem; font-size: 0.85rem; }
.status-bar.pending_client, .status-bar.pending_admin { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); }
.status-bar.fully_signed { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); }
.status-bar.disputed { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); }
.status-bar.skipped { background: rgba(71,85,105,0.1); border: 1px solid rgba(71,85,105,0.2); }
.status-tag { padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.status-tag.pending_client, .status-tag.pending_admin { background: rgba(59,130,246,0.2); color: #60a5fa; }
.status-tag.fully_signed { background: rgba(34,197,94,0.2); color: #4ade80; }
.status-tag.disputed { background: rgba(245,158,11,0.2); color: #fbbf24; }
.status-tag.skipped { background: rgba(71,85,105,0.2); color: #94a3b8; }
.status-detail { color: #94a3b8; font-size: 0.8rem; }

.contract-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(71,85,105,0.2); border-radius: 0.875rem; padding: 1.5rem; margin-bottom: 1rem; }
.contract-card h2 { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; }
.contract-html { color: #cbd5e1; font-size: 0.875rem; line-height: 1.6; max-height: 400px; overflow-y: auto; padding-right: 0.5rem; }

.signed-card { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 0.875rem; padding: 1.5rem; text-align: center; color: #4ade80; }
.signed-card i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }

.action-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(71,85,105,0.2); border-radius: 0.875rem; padding: 1.5rem; }
.sign-section { margin-bottom: 1.5rem; }
.agree-row { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; cursor: pointer; font-size: 0.875rem; color: #cbd5e1; }
.agree-row input { accent-color: #7c3aed; margin-top: 0.15rem; }

.btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.5rem; background: linear-gradient(135deg,#7c3aed,#6d28d9); border: none; border-radius: 0.625rem; color: white; font-size: 0.875rem; font-weight: 600; cursor: pointer; width: 100%; justify-content: center; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.dispute-section { border-top: 1px solid rgba(71,85,105,0.2); padding-top: 1rem; }
.btn-text { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 0.4rem; }
.btn-text:hover { color: #fbbf24; }

.dispute-form { display: flex; flex-direction: column; gap: 0.75rem; }
.dispute-form label { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
.dispute-form textarea { width: 100%; padding: 0.7rem; background: rgba(30,41,59,0.6); border: 1px solid rgba(71,85,105,0.4); border-radius: 0.625rem; color: #f1f5f9; font-size: 0.85rem; outline: none; resize: vertical; box-sizing: border-box; font-family: inherit; }
.dispute-form textarea:focus { border-color: #f59e0b; }
.dispute-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.btn-secondary { padding: 0.6rem 1rem; background: rgba(30,41,59,0.6); border: 1px solid rgba(71,85,105,0.4); border-radius: 0.625rem; color: #94a3b8; font-size: 0.8rem; cursor: pointer; }
.btn-warn { padding: 0.6rem 1rem; background: #d97706; border: none; border-radius: 0.625rem; color: white; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
.btn-warn:disabled { opacity: 0.5; }
</style>
