<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Select from "primevue/select";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Editor from "primevue/editor";
import { useToast } from "primevue/usetoast";
import ChatWindow from "@/components/chat/ChatWindow.vue";

const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const order = ref(null);
const history = ref([]);
const progress = ref([]);
const contract = ref(null);
const loading = ref(true);
const collaborators = ref([]);
const selectedCollab = ref(null);
const generatingContract = ref(false);
const signingContract = ref(false);
const adminAgreed = ref(false);
const progressTitle = ref("");
const progressDesc = ref("");
const posting = ref(false);
const editingContract = ref(false);
const contractEditHtml = ref("");
const savingContract = ref(false);
const proofUrl = ref(null);
const proofType = ref(null);

// Credentials
const credentialsUploaded = ref(false);
const credentials = ref(null);
const showingCredentials = ref(false);
const loadingCreds = ref(false);

// Confirm dialog
const confirmVisible = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const confirmSeverity = ref("help");
let confirmCallback = null;

const statusColors = { pending: "warn", accepted: "info", payment_confirmed: "info", in_progress: "help", completed: "success", cancelled: "danger", rejected: "danger" };
const contractStatusColors = { draft: "warn", pending_client: "info", pending_admin: "warn", fully_signed: "success", voided: "danger", disputed: "warn", skipped: "secondary" };

const canViewCredentials = computed(() => ["in_progress", "completed"].includes(order.value?.status));
const serviceSnapshot = computed(() => {
  if (!order.value?.service_snapshot) return null;
  const s = order.value.service_snapshot;
  return typeof s === "string" ? JSON.parse(s) : s;
});

function showConfirm(title, message, severity, callback) {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmSeverity.value = severity;
  confirmCallback = callback;
  confirmVisible.value = true;
}
function onConfirm() { confirmVisible.value = false; if (confirmCallback) confirmCallback(); }

async function fetchOrder() {
  loading.value = true;
  try {
    const { data } = await api.get(`/orders/${route.params.id}`);
    order.value = data.data;
    const { data: h } = await api.get(`/orders/${route.params.id}/history`);
    history.value = h.data;
    const { data: p } = await api.get(`/orders/${route.params.id}/progress`);
    progress.value = p.data;
    await fetchContract();
    await checkCredentials();
    await fetchPaymentProof();
  } finally { loading.value = false; }
}

async function checkCredentials() {
  try {
    const { data } = await api.get(`/orders/${route.params.id}/credentials/status`);
    credentialsUploaded.value = data.data.uploaded;
  } catch { credentialsUploaded.value = false; }
}

async function fetchPaymentProof() {
  try {
    const { data } = await api.get(`/orders/${route.params.id}/payment-proof`);
    proofUrl.value = data.data.proof_url;
    proofType.value = data.data.proof_type;
  } catch { /* no proof yet */ }
}

// Credential view with verification code
const credStep = ref("idle"); // idle | code_sent | viewing
const credCode = ref("");
const credDestination = ref("");
const credTimer = ref(0);
let credTimerInterval = null;

async function requestCredCode() {
  loadingCreds.value = true;
  try {
    const { data } = await api.post(`/orders/${route.params.id}/credentials/request-code`);
    credDestination.value = data.data.destination;
    credStep.value = "code_sent";
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { loadingCreds.value = false; }
}

async function verifyCredCode() {
  loadingCreds.value = true;
  try {
    const { data } = await api.post(`/orders/${route.params.id}/credentials/view`, { code: credCode.value });
    credentials.value = data.data;
    showingCredentials.value = true;
    credStep.value = "viewing";
    credCode.value = "";
    // Auto-hide timer
    credTimer.value = data.viewTTL || 120;
    credTimerInterval = setInterval(() => {
      credTimer.value--;
      if (credTimer.value <= 0) {
        clearInterval(credTimerInterval);
        credentials.value = null;
        showingCredentials.value = false;
        credStep.value = "idle";
      }
    }, 1000);
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { loadingCreds.value = false; }
}

function hideCredentials() {
  if (credTimerInterval) clearInterval(credTimerInterval);
  credentials.value = null;
  showingCredentials.value = false;
  credStep.value = "idle";
  credTimer.value = 0;
}

async function fetchContract() {
  try { const { data } = await api.get(`/orders/${route.params.id}/contract`); contract.value = data.data; }
  catch { contract.value = null; }
}

async function fetchCollaborators() {
  const { data } = await api.get("/users", { params: { role: "collaborator", limit: 100 } });
  collaborators.value = data.data.map((u) => ({ label: u.username, value: u.id }));
}

async function doAction(action, body = {}) {
  try {
    await api.patch(`/orders/${route.params.id}/${action}`, body);
    toast.add({ severity: "success", summary: t(`orders.${action === 'confirm-payment' ? 'confirm_payment' : action}`), life: 3000 });
    fetchOrder();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  }
}

function confirmAction(action, body = {}) {
  const labels = {
    accept: { title: t("orders.accept"), msg: t("confirm.accept_order"), sev: "success" },
    reject: { title: t("orders.reject"), msg: t("confirm.reject_order"), sev: "danger" },
    "confirm-payment": { title: t("orders.confirm_payment"), msg: t("confirm.confirm_payment"), sev: "info" },
    start: { title: t("orders.start"), msg: t("confirm.start_order"), sev: "help" },
    complete: { title: t("orders.complete"), msg: t("confirm.complete_order"), sev: "success" },
  };
  const l = labels[action] || { title: action, msg: t("confirm.generic"), sev: "help" };

  // Special handling for "start": check credentials first
  if (action === "start" && !credentialsUploaded.value) {
    showConfirm(
      t("orders.start"),
      t("confirm.start_no_credentials"),
      "warn",
      () => doAction(action, body)
    );
    return;
  }

  showConfirm(l.title, l.msg, l.sev, () => doAction(action, body));
}

function confirmAssign() {
  if (!selectedCollab.value) return;
  const name = collaborators.value.find(c => c.value === selectedCollab.value)?.label || "";
  showConfirm(t("orders.assign"), t("confirm.assign_order", { name }), "info", () => doAction("assign", { collaborator_id: selectedCollab.value }));
}

async function generateContract() {
  generatingContract.value = true;
  try {
    await api.post(`/orders/${route.params.id}/contract`, {});
    toast.add({ severity: "success", summary: t("contracts.generated"), life: 3000 });
    await fetchContract();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { generatingContract.value = false; }
}

async function signAsAdmin() {
  signingContract.value = true;
  try {
    await api.post(`/orders/${route.params.id}/contract/sign/admin`, { consent_text: "I agree to the terms" });
    toast.add({ severity: "success", summary: t("contracts.signed_admin"), life: 3000 });
    await fetchContract();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { signingContract.value = false; }
}

function startEditContract() {
  contractEditHtml.value = contract.value.content_html;
  editingContract.value = true;
}

async function saveContractEdit() {
  savingContract.value = true;
  try {
    await api.patch(`/orders/${route.params.id}/contract`, { content_html: contractEditHtml.value });
    toast.add({ severity: "success", summary: t("contracts.save_changes"), life: 3000 });
    editingContract.value = false;
    await fetchContract();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { savingContract.value = false; }
}

async function skipContract() {
  try {
    await api.post(`/orders/${route.params.id}/contract/skip`);
    toast.add({ severity: "success", summary: t("contracts.skipped"), life: 3000 });
    await fetchContract();
    fetchOrder();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  }
}

async function postProgressUpdate() {
  if (!progressTitle.value.trim()) return;
  posting.value = true;
  try {
    await api.post(`/orders/${route.params.id}/progress`, { title: progressTitle.value, description: progressDesc.value });
    toast.add({ severity: "success", summary: t("orders.post_progress"), life: 3000 });
    progressTitle.value = ""; progressDesc.value = "";
    fetchOrder();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { posting.value = false; }
}

onMounted(() => { fetchOrder(); fetchCollaborators(); });
</script>

<template>
  <!-- Confirm dialog -->
  <teleport to="body">
    <div v-if="confirmVisible" class="confirm-overlay" @click.self="confirmVisible = false">
      <div class="confirm-card">
        <div class="confirm-icon" :class="confirmSeverity"><i class="pi pi-exclamation-triangle"></i></div>
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="confirmVisible = false">{{ t('common.cancel') }}</button>
          <button class="btn-confirm" :class="confirmSeverity" @click="onConfirm">{{ t('common.yes') }}, {{ confirmTitle }}</button>
        </div>
      </div>
    </div>
  </teleport>

  <nav v-if="order" class="breadcrumb">
    <router-link to="/admin/orders" class="breadcrumb-link">{{ t('breadcrumb.orders') }}</router-link>
    <i class="pi pi-angle-right breadcrumb-sep" />
    <span class="breadcrumb-current">{{ order.order_number }}</span>
  </nav>

  <div v-if="loading" class="text-slate-400">{{ t('common.loading') }}</div>
  <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">

      <!-- Order info -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold">{{ t('orders.order_number') }} {{ order.order_number }}</h1>
          <Tag :value="t(`orders.status.${order.status}`)" :severity="statusColors[order.status]" class="text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-slate-400">{{ t('orders.client') }}:</span> {{ order.client_name }}</div>
          <div><span class="text-slate-400">{{ t('common.price') }}:</span> ${{ Number(order.total_price).toFixed(2) }}</div>
          <div><span class="text-slate-400">{{ t('orders.assigned_to') }}:</span> {{ order.collaborator_name || t('orders.unassigned') }}</div>
          <div><span class="text-slate-400">{{ t('orders.created') }}:</span> {{ new Date(order.created_at).toLocaleDateString() }}</div>
        </div>
      </div>

      <!-- Client request / Goal (prominent) -->
      <div class="request-card">
        <div class="request-header">
          <i class="pi pi-bullseye"></i>
          <h2>{{ t('orders.client_request') }}</h2>
        </div>
        <div class="request-body">
          <div v-if="serviceSnapshot" class="request-service">
            <span class="request-label">{{ t('orders.service_requested') }}:</span>
            <span class="request-value">{{ serviceSnapshot.name }} — {{ serviceSnapshot.game }} ({{ serviceSnapshot.platform }})</span>
          </div>
          <div class="request-goal">
            <span class="request-label">{{ t('orders.requested_goal') }}:</span>
            <p class="goal-text">{{ order.desired_result || t('orders.no_goal_specified') }}</p>
          </div>
        </div>
      </div>

      <!-- Payment proof (admin view) -->
      <div v-if="['accepted','payment_confirmed','in_progress','completed'].includes(order.status)" class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold flex items-center gap-2"><i class="pi pi-receipt" style="color: #a78bfa"></i> {{ t('orders.payment_proof') }}</h2>
          <Tag v-if="proofUrl" :value="t('orders.proof_uploaded')" severity="success" class="text-xs" />
          <Tag v-else :value="t('orders.proof_not_uploaded')" severity="warn" class="text-xs" />
        </div>
        <div v-if="proofUrl">
          <div v-if="proofType === 'pdf'" style="display:flex;align-items:center;gap:0.75rem;padding:1rem;background:rgba(30,41,59,0.5);border-radius:0.5rem">
            <i class="pi pi-file-pdf" style="font-size:2rem;color:#ef4444"></i>
            <a :href="proofUrl" target="_blank" style="color:#a78bfa;text-decoration:none;font-weight:500">{{ t('orders.view_proof') }}</a>
          </div>
          <div v-else>
            <a :href="proofUrl" target="_blank"><img :src="proofUrl" alt="Payment proof" style="max-width:100%;max-height:300px;border-radius:0.5rem;object-fit:contain" /></a>
          </div>
        </div>
        <p v-else class="text-slate-500 text-sm">{{ t('orders.proof_pending') }}</p>
      </div>

      <!-- Actions -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-wrap gap-3">
        <Button v-if="order.status === 'pending'" :label="t('orders.accept')" severity="success" size="small" @click="confirmAction('accept')" />
        <Button v-if="order.status === 'pending'" :label="t('orders.reject')" severity="danger" size="small" @click="confirmAction('reject', { reason: 'Rejected' })" />
        <Button v-if="order.status === 'accepted'" :label="t('orders.confirm_payment')" severity="info" size="small" @click="confirmAction('confirm-payment')" />
        <Button v-if="order.status === 'payment_confirmed'" :label="t('orders.start')" severity="help" size="small" @click="confirmAction('start')" />
        <Button v-if="order.status === 'in_progress'" :label="t('orders.complete')" severity="success" size="small" @click="confirmAction('complete')" />
        <div class="flex gap-2 items-center">
          <Select v-model="selectedCollab" :options="collaborators" optionLabel="label" optionValue="value" :placeholder="t('orders.assign_collaborator')" class="w-48" />
          <Button :label="t('orders.assign')" size="small" severity="secondary" :disabled="!selectedCollab" @click="confirmAssign" />
        </div>
      </div>

      <!-- Credentials (secured with verification code) -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold flex items-center gap-2"><i class="pi pi-lock"></i> {{ t('credentials.title') }}</h2>
          <Tag v-if="credentialsUploaded" :value="t('credentials.uploaded')" severity="success" class="text-xs" />
          <Tag v-else :value="t('credentials.not_uploaded')" severity="warn" class="text-xs" />
        </div>

        <!-- Not in progress yet -->
        <div v-if="!canViewCredentials" class="text-slate-500 text-sm flex items-center gap-2 py-4">
          <i class="pi pi-shield"></i>
          {{ t('credentials.available_on_start') }}
        </div>

        <!-- Not uploaded -->
        <div v-else-if="!credentialsUploaded" class="text-slate-500 text-sm py-4">
          {{ t('credentials.not_uploaded') }}
        </div>

        <!-- Step 1: Request code -->
        <div v-else-if="credStep === 'idle'" class="py-2">
          <p class="text-slate-400 text-sm mb-3"><i class="pi pi-shield" style="color:#a78bfa"></i> {{ t('credentials.available_on_start').replace('en progreso', '') }} Se enviará un código de verificación.</p>
          <Button :label="t('credentials.request_code')" icon="pi pi-key" severity="help" size="small" :loading="loadingCreds" @click="requestCredCode" />
        </div>

        <!-- Step 2: Enter code -->
        <div v-else-if="credStep === 'code_sent'" class="py-2">
          <p class="text-slate-300 text-sm mb-3">{{ t('credentials.enter_code') }} <strong>{{ credDestination }}</strong></p>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <input v-model="credCode" type="text" maxlength="6" :placeholder="t('security.code_placeholder')"
              style="width:160px;padding:0.65rem;background:rgba(30,41,59,0.6);border:1px solid rgba(71,85,105,0.4);border-radius:0.625rem;color:#f1f5f9;font-size:1rem;text-align:center;letter-spacing:0.3em;outline:none" />
            <Button :label="t('credentials.verify_to_view')" icon="pi pi-check" severity="help" size="small" :loading="loadingCreds" :disabled="credCode.length < 6" @click="verifyCredCode" />
          </div>
        </div>

        <!-- Step 3: Viewing (with timer) -->
        <div v-else-if="credStep === 'viewing' && credentials" class="cred-viewer">
          <div class="cred-timer">
            <i class="pi pi-clock"></i>
            {{ t('credentials.visible_for') }} <strong>{{ Math.floor(credTimer / 60) }}:{{ String(credTimer % 60).padStart(2, '0') }}</strong>
          </div>
          <div class="cred-field">
            <span class="cred-label">{{ t('credentials.username_label') }}</span>
            <span class="cred-value">{{ credentials?.username }}</span>
          </div>
          <div class="cred-field">
            <span class="cred-label">{{ t('credentials.password_label') }}</span>
            <span class="cred-value cred-password">{{ credentials?.password }}</span>
          </div>
          <div v-if="credentials?.notes" class="cred-field">
            <span class="cred-label">{{ t('credentials.notes_label') }}</span>
            <span class="cred-value">{{ credentials.notes }}</span>
          </div>
          <Button :label="t('credentials.hide')" icon="pi pi-eye-slash" severity="secondary" size="small" class="mt-3" @click="hideCredentials" />
        </div>
      </div>

      <!-- Progress form -->
      <div v-if="order.status === 'in_progress' || order.status === 'payment_confirmed'" class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 class="font-bold mb-4">{{ t('orders.post_progress') }}</h2>
        <form @submit.prevent="postProgressUpdate" class="space-y-3">
          <InputText v-model="progressTitle" :placeholder="t('orders.progress_title')" class="w-full" required />
          <Textarea v-model="progressDesc" :placeholder="t('orders.progress_details')" rows="2" class="w-full" />
          <Button type="submit" :label="t('orders.post_progress')" icon="pi pi-plus" :loading="posting" severity="help" size="small" :disabled="!progressTitle.trim()" />
        </form>
      </div>

      <!-- Contract -->
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold">{{ t('contracts.title') }}</h2>
          <div class="flex gap-2 items-center">
            <Tag v-if="contract" :value="t(`contracts.status.${contract.status}`, contract.status)" :severity="contractStatusColors[contract.status] || 'secondary'" class="text-xs" />
          </div>
        </div>

        <!-- No contract: generate or skip -->
        <div v-if="!contract" class="text-center py-6">
          <i class="pi pi-file text-3xl text-slate-600 mb-3 block"></i>
          <p class="text-slate-500 text-sm mb-4">{{ t('contracts.not_generated') }}</p>
          <div class="flex gap-3 justify-center">
            <Button :label="t('contracts.generate')" icon="pi pi-file-plus" severity="help" :loading="generatingContract" @click="showConfirm(t('contracts.generate'), t('confirm.generate_contract'), 'help', generateContract)" />
            <Button :label="t('contracts.skip')" icon="pi pi-forward" severity="secondary" @click="showConfirm(t('contracts.skip'), t('contracts.skip_confirm'), 'warn', skipContract)" />
          </div>
        </div>

        <!-- Contract exists -->
        <div v-else>
          <!-- Dispute alert -->
          <div v-if="contract.status === 'disputed'" class="dispute-alert">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <p class="dispute-title">{{ t('contracts.disputed') }}</p>
              <p class="dispute-reason">"{{ contract.dispute_reason }}"</p>
            </div>
          </div>

          <!-- Editable content (before signatures) -->
          <div v-if="editingContract" class="mb-4">
            <label class="block text-sm text-slate-400 mb-2">{{ t('contracts.edit_content') }}</label>
            <div class="contract-editor">
              <Editor v-model="contractEditHtml" editorStyle="height: 320px; color: #f1f5f9; background: rgba(30,41,59,0.6);" />
            </div>
            <div class="flex gap-2 mt-3">
              <Button :label="t('contracts.save_changes')" icon="pi pi-check" severity="help" :loading="savingContract" @click="saveContractEdit" />
              <Button :label="t('common.cancel')" severity="secondary" @click="editingContract = false" />
            </div>
          </div>
          <div v-else>
            <div class="prose prose-invert prose-sm max-w-none border border-slate-700 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto" v-html="contract.content_html" />
            <!-- Edit button (before client signs, or when disputed) -->
            <div v-if="!contract.client_signed_at && contract.status !== 'skipped' && contract.status !== 'fully_signed'" class="flex gap-2 mb-4">
              <Button :label="t('contracts.edit')" icon="pi pi-pencil" severity="secondary" size="small" @click="startEditContract" />
              <Button :label="t('contracts.skip')" icon="pi pi-forward" severity="secondary" size="small" @click="showConfirm(t('contracts.skip'), t('contracts.skip_confirm'), 'warn', skipContract)" />
            </div>
          </div>

          <!-- Signatures (not shown if skipped) -->
          <div v-if="contract.status !== 'skipped'" class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div class="p-3 rounded-lg" :class="contract.client_signed_at ? 'bg-green-900/20 border border-green-800' : 'bg-slate-800/50 border border-slate-700'">
              <p class="font-medium" :class="contract.client_signed_at ? 'text-green-400' : 'text-slate-400'">
                <i :class="contract.client_signed_at ? 'pi pi-check-circle' : 'pi pi-clock'" class="mr-1"></i>{{ t('contracts.client_signature') }}
              </p>
              <p class="text-xs mt-1" :class="contract.client_signed_at ? 'text-green-500' : 'text-slate-500'">{{ contract.client_signed_at ? new Date(contract.client_signed_at).toLocaleString() : t('contracts.pending') }}</p>
            </div>
            <div class="p-3 rounded-lg" :class="contract.admin_signed_at ? 'bg-green-900/20 border border-green-800' : 'bg-slate-800/50 border border-slate-700'">
              <p class="font-medium" :class="contract.admin_signed_at ? 'text-green-400' : 'text-slate-400'">
                <i :class="contract.admin_signed_at ? 'pi pi-check-circle' : 'pi pi-clock'" class="mr-1"></i>{{ t('contracts.admin_signature') }}
              </p>
              <p class="text-xs mt-1" :class="contract.admin_signed_at ? 'text-green-500' : 'text-slate-500'">{{ contract.admin_signed_at ? new Date(contract.admin_signed_at).toLocaleString() : t('contracts.pending') }}</p>
            </div>
          </div>

          <!-- Admin sign (if not signed and not skipped) -->
          <div v-if="!contract.admin_signed_at && contract.status !== 'skipped' && contract.status !== 'disputed'" class="border-t border-slate-700 pt-4">
            <div class="flex items-start gap-3 mb-3">
              <Checkbox v-model="adminAgreed" :binary="true" inputId="admin-agree" />
              <label for="admin-agree" class="text-sm text-slate-300 cursor-pointer">{{ t('contracts.agree_terms') }}</label>
            </div>
            <Button :label="t('contracts.sign_as_admin')" icon="pi pi-check" severity="help" :disabled="!adminAgreed" :loading="signingContract" @click="showConfirm(t('contracts.sign_as_admin'), t('confirm.sign_contract'), 'help', signAsAdmin)" />
          </div>

          <!-- Skipped info -->
          <div v-if="contract.status === 'skipped'" class="text-slate-500 text-sm text-center py-2">
            <i class="pi pi-forward mr-1"></i> {{ t('contracts.skipped') }}
          </div>
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
              <span class="text-slate-500 ml-2">{{ h.changed_by_name }}</span>
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
          <p class="text-xs text-slate-500">{{ p.posted_by_name }} - {{ new Date(p.created_at).toLocaleString() }}</p>
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

/* Client request card */
.request-card {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(59, 130, 246, 0.05));
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 0.875rem; padding: 1.5rem;
}
.request-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.request-header i { color: #a78bfa; font-size: 1.1rem; }
.request-header h2 { font-weight: 700; font-size: 1rem; margin: 0; }
.request-body { display: flex; flex-direction: column; gap: 0.75rem; }
.request-service { font-size: 0.85rem; }
.request-label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 0.25rem; }
.request-value { color: #e2e8f0; }
.request-goal { }
.goal-text { color: #f1f5f9; font-size: 1.1rem; font-weight: 600; margin: 0; padding: 0.75rem; background: rgba(15, 23, 42, 0.5); border-radius: 0.5rem; border-left: 3px solid #7c3aed; }

/* Credentials viewer */
.cred-viewer { display: flex; flex-direction: column; gap: 0.75rem; }
.cred-field { display: flex; flex-direction: column; gap: 0.2rem; }
.cred-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.cred-value { font-size: 0.9rem; color: #f1f5f9; background: rgba(30, 41, 59, 0.5); padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-family: monospace; }
.cred-password { color: #fbbf24; }
.cred-timer {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 0.5rem;
  color: #fbbf24; font-size: 0.8rem; margin-bottom: 0.75rem;
}

/* Confirm dialog */
.confirm-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.confirm-card {
  background: #0f172a; border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 1rem; padding: 2rem; width: 100%; max-width: 420px;
  text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.confirm-icon {
  width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 1rem;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
}
.confirm-icon.success { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.confirm-icon.danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.confirm-icon.info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.confirm-icon.help { background: rgba(124, 58, 237, 0.15); color: #a78bfa; }
.confirm-card h3 { font-size: 1.125rem; font-weight: 700; color: #f1f5f9; margin: 0 0 0.5rem; }
.confirm-card p { color: #94a3b8; font-size: 0.875rem; margin: 0 0 1.5rem; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: center; }
.btn-cancel {
  padding: 0.6rem 1.25rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem;
  color: #94a3b8; font-size: 0.85rem; cursor: pointer;
}
.btn-cancel:hover { background: rgba(30, 41, 59, 0.8); }
.btn-confirm {
  padding: 0.6rem 1.25rem; border: none; border-radius: 0.625rem;
  color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-confirm.success { background: #16a34a; }
.btn-confirm.danger { background: #dc2626; }
.btn-confirm.info { background: #2563eb; }
.btn-confirm.help { background: #7c3aed; }
.btn-confirm.warn { background: #d97706; }
.confirm-icon.warn { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

.dispute-alert {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 1rem; margin-bottom: 1rem;
  background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 0.625rem; color: #fbbf24;
}
.dispute-alert i { font-size: 1.25rem; margin-top: 0.1rem; }
.dispute-title { font-weight: 600; font-size: 0.875rem; margin: 0 0 0.25rem; }
.dispute-reason { color: #94a3b8; font-size: 0.8rem; font-style: italic; margin: 0; }

.contract-editor :deep(.ql-toolbar) {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(71, 85, 105, 0.4) !important;
  border-radius: 0.625rem 0.625rem 0 0;
}
.contract-editor :deep(.ql-toolbar .ql-stroke) { stroke: #94a3b8; }
.contract-editor :deep(.ql-toolbar .ql-fill) { fill: #94a3b8; }
.contract-editor :deep(.ql-toolbar .ql-picker-label) { color: #94a3b8; }
.contract-editor :deep(.ql-toolbar button:hover .ql-stroke) { stroke: #a78bfa; }
.contract-editor :deep(.ql-toolbar button.ql-active .ql-stroke) { stroke: #a78bfa; }
.contract-editor :deep(.ql-container) {
  border-color: rgba(71, 85, 105, 0.4) !important;
  border-radius: 0 0 0.625rem 0.625rem;
  background: rgba(15, 23, 42, 0.6);
  font-size: 0.875rem;
}
.contract-editor :deep(.ql-editor) { color: #f1f5f9; min-height: 300px; }
.contract-editor :deep(.ql-editor h1, .ql-editor h2, .ql-editor h3) { color: #f1f5f9; }
.contract-editor :deep(.ql-editor a) { color: #a78bfa; }
.contract-editor :deep(.ql-snow .ql-picker-options) { background: #1e293b; border-color: rgba(71,85,105,0.4); }
</style>
