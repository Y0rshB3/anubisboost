<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const toast = useToast();
const users = ref([]);
const bans = ref([]);
const loading = ref(true);
const search = ref("");
const confirmVisible = ref(false);
const confirmMsg = ref("");
const banReason = ref("");
let confirmCb = null;

async function fetchUsers() {
  loading.value = true;
  try {
    const { data } = await api.get("/admin/users", { params: { search: search.value, limit: 100 } });
    users.value = data.data;
  } finally { loading.value = false; }
}

async function fetchBans() {
  const { data } = await api.get("/admin/bans");
  bans.value = data.data.filter(b => b.is_active);
}

function isBanned(user) {
  return !user.is_active || bans.value.some(b => b.is_active && ((b.ban_type === "email" && b.ban_value === user.email) || (b.ban_type === "ip" && b.ban_value === user.last_login_ip)));
}

function showConfirm(msg, cb) { confirmMsg.value = msg; confirmCb = cb; confirmVisible.value = true; }

async function banUser(userId) {
  try {
    await api.post(`/admin/users/${userId}/ban`, { reason: banReason.value || "Banned by admin" });
    toast.add({ severity: "success", summary: t("users_admin.ban_user"), life: 3000 });
    banReason.value = "";
    confirmVisible.value = false;
    fetchUsers(); fetchBans();
  } catch (err) { toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message, life: 5000 }); }
}

async function unbanUser(userId) {
  try {
    await api.post(`/admin/users/${userId}/unban`);
    toast.add({ severity: "success", summary: t("users_admin.unban_user"), life: 3000 });
    confirmVisible.value = false;
    fetchUsers(); fetchBans();
  } catch (err) { toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message, life: 5000 }); }
}

async function removeBan(banId) {
  await api.delete(`/admin/bans/${banId}`);
  toast.add({ severity: "success", summary: t("users_admin.remove_ban"), life: 3000 });
  fetchBans();
}

onMounted(() => { fetchUsers(); fetchBans(); });
</script>

<template>
  <!-- Confirm/Ban dialog -->
  <teleport to="body">
    <div v-if="confirmVisible" class="confirm-overlay" @click.self="confirmVisible = false">
      <div class="confirm-card">
        <div class="confirm-icon"><i class="pi pi-ban"></i></div>
        <h3>{{ confirmMsg }}</h3>
        <div class="form-group" style="text-align:left;margin:1rem 0">
          <label>{{ t('users_admin.ban_reason') }}</label>
          <input v-model="banReason" :placeholder="t('users_admin.ban_reason_placeholder')" />
        </div>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="confirmVisible = false">{{ t('common.cancel') }}</button>
          <button class="btn-confirm danger" @click="confirmCb && confirmCb()">{{ t('users_admin.ban_user') }}</button>
        </div>
      </div>
    </div>
  </teleport>

  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t('users_admin.title') }}</h1>

    <div class="mb-4">
      <InputText v-model="search" :placeholder="t('users_admin.search_users')" class="w-full max-w-md" @input="fetchUsers" />
    </div>

    <DataTable :value="users" :loading="loading" stripedRows class="rounded-xl overflow-hidden mb-8">
      <Column field="username" :header="t('collaborators.username')" sortable />
      <Column field="email" :header="t('collaborators.email')" sortable />
      <Column field="role" :header="t('profile.role')">
        <template #body="{ data }"><Tag :value="data.role" :severity="data.role === 'admin' ? 'help' : data.role === 'collaborator' ? 'info' : 'secondary'" /></template>
      </Column>
      <Column :header="t('common.status')">
        <template #body="{ data }">
          <Tag v-if="isBanned(data)" :value="t('users_admin.banned')" severity="danger" />
          <Tag v-else-if="data.is_active" :value="t('common.active')" severity="success" />
          <Tag v-else :value="t('common.inactive')" severity="warn" />
        </template>
      </Column>
      <Column field="two_factor_enabled" header="2FA">
        <template #body="{ data }"><Tag :value="data.two_factor_enabled ? 'ON' : 'OFF'" :severity="data.two_factor_enabled ? 'success' : 'secondary'" class="text-xs" /></template>
      </Column>
      <Column field="last_login_ip" :header="t('users_admin.last_ip')">
        <template #body="{ data }"><span class="text-xs font-mono text-slate-400">{{ data.last_login_ip || '-' }}</span></template>
      </Column>
      <Column :header="t('common.actions')" style="width: 150px">
        <template #body="{ data }">
          <div class="flex gap-2" v-if="data.role !== 'admin'">
            <Button v-if="!isBanned(data)" :label="t('users_admin.ban_user')" severity="danger" size="small"
                    @click="showConfirm(t('users_admin.confirm_ban'), () => banUser(data.id))" />
            <Button v-else :label="t('users_admin.unban_user')" severity="success" size="small" @click="unbanUser(data.id)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Active bans -->
    <h2 class="text-xl font-bold mb-4">{{ t('users_admin.bans_list') }}</h2>
    <div v-if="!bans.length" class="text-slate-500">{{ t('users_admin.no_bans') }}</div>
    <DataTable v-else :value="bans" stripedRows class="rounded-xl overflow-hidden">
      <Column field="ban_type" :header="t('users_admin.ban_type')">
        <template #body="{ data }"><Tag :value="data.ban_type.toUpperCase()" :severity="data.ban_type === 'ip' ? 'danger' : 'warn'" /></template>
      </Column>
      <Column field="ban_value" :header="t('users_admin.ban_value')">
        <template #body="{ data }"><span class="font-mono text-sm">{{ data.ban_value }}</span></template>
      </Column>
      <Column field="reason" :header="t('users_admin.ban_reason')" />
      <Column field="banned_by_name" header="Por" />
      <Column :header="t('common.actions')" style="width: 100px">
        <template #body="{ data }">
          <Button :label="t('users_admin.remove_ban')" severity="secondary" size="small" @click="removeBan(data.id)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.confirm-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.confirm-card { background: #0f172a; border: 1px solid rgba(71,85,105,0.3); border-radius: 1rem; padding: 2rem; width: 100%; max-width: 420px; text-align: center; }
.confirm-icon { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: rgba(239,68,68,0.15); color: #f87171; }
.confirm-card h3 { font-size: 1rem; color: #f1f5f9; margin: 0 0 0.5rem; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; }
.btn-cancel { padding: 0.6rem 1.25rem; background: rgba(30,41,59,0.6); border: 1px solid rgba(71,85,105,0.4); border-radius: 0.625rem; color: #94a3b8; cursor: pointer; }
.btn-confirm { padding: 0.6rem 1.25rem; border: none; border-radius: 0.625rem; color: white; font-weight: 600; cursor: pointer; }
.btn-confirm.danger { background: #dc2626; }
.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; }
.form-group input { width: 100%; padding: 0.65rem 0.75rem; background: rgba(30,41,59,0.6); border: 1px solid rgba(71,85,105,0.4); border-radius: 0.625rem; color: #f1f5f9; font-size: 0.85rem; outline: none; box-sizing: border-box; }
</style>
