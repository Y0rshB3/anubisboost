<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const toast = useToast();

const platforms = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const form = ref({ name: "", icon_url: "" });
const saving = ref(false);
const error = ref("");

async function fetchPlatforms() {
  loading.value = true;
  try {
    const { data } = await api.get("/catalog/platforms");
    platforms.value = data.data;
  } finally { loading.value = false; }
}

function openCreate() {
  editingId.value = null;
  form.value = { name: "", icon_url: "" };
  showForm.value = true;
  error.value = "";
}

function openEdit(platform) {
  editingId.value = platform.id;
  form.value = { name: platform.name, icon_url: platform.icon_url || "" };
  showForm.value = true;
  error.value = "";
}

async function save() {
  if (!form.value.name.trim()) { error.value = "Name is required"; return; }
  saving.value = true;
  error.value = "";
  try {
    if (editingId.value) {
      await api.patch(`/catalog/platforms/${editingId.value}`, form.value);
    } else {
      await api.post("/catalog/platforms", form.value);
    }
    toast.add({ severity: "success", summary: editingId.value ? t("common.update") : t("common.create"), life: 3000 });
    showForm.value = false;
    fetchPlatforms();
  } catch (err) {
    error.value = err.response?.data?.message || "Error saving platform";
  } finally { saving.value = false; }
}

async function deletePlatform(id) {
  if (!confirm("Delete this platform?")) return;
  try {
    await api.delete(`/catalog/platforms/${id}`);
    fetchPlatforms();
  } catch (err) {
    alert(err.response?.data?.message || "Error deleting");
  }
}

function cancelForm() {
  showForm.value = false;
  error.value = "";
}

onMounted(fetchPlatforms);
</script>

<template>
  <div class="platforms-page">
    <div class="page-header">
      <h1>{{ t('platforms.title') }}</h1>
      <button class="btn-primary" @click="openCreate">
        <i class="pi pi-plus"></i> {{ t('platforms.add') }}
      </button>
    </div>

    <!-- Form modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="modal-card">
        <h2>{{ editingId ? t('platforms.edit') : t('platforms.new') }}</h2>
        <form @submit.prevent="save" class="modal-form">
          <div class="form-group">
            <label>{{ t('platforms.name') }}</label>
            <input v-model="form.name" type="text" :placeholder="t('platforms.name_placeholder')" required />
          </div>
          <div class="form-group">
            <label>{{ t('platforms.icon_url') }}</label>
            <input v-model="form.icon_url" type="text" placeholder="https://..." />
          </div>
          <p v-if="error" class="error-text">{{ error }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="cancelForm">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <i v-if="saving" class="pi pi-spin pi-spinner"></i>
              {{ editingId ? t('common.update') : t('common.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="!platforms.length" class="empty-state">
      <i class="pi pi-desktop"></i>
      <p>{{ t('platforms.no_platforms') }}</p>
      <button class="btn-primary" @click="openCreate">{{ t('platforms.add_first') }}</button>
    </div>
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>{{ t('common.name') }}</th>
            <th>{{ t('platforms.slug') }}</th>
            <th>{{ t('platforms.icon') }}</th>
            <th>{{ t('common.status') }}</th>
            <th style="width: 140px">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in platforms" :key="p.id">
            <td class="name-cell">
              <img v-if="p.icon_url" :src="p.icon_url" :alt="p.name" class="platform-icon" />
              <span>{{ p.name }}</span>
            </td>
            <td class="slug-cell">{{ p.slug }}</td>
            <td>
              <span v-if="p.icon_url" class="badge badge-info">{{ t('common.set') }}</span>
              <span v-else class="badge badge-muted">{{ t('common.none') }}</span>
            </td>
            <td>
              <span class="badge badge-success">{{ t('common.active') }}</span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon" title="Edit" @click="openEdit(p)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="btn-icon btn-icon-danger" title="Delete" @click="deletePlatform(p.id)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.platforms-page { color: #f1f5f9; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none; border-radius: 0.625rem; color: white;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #6d28d9, #5b21b6); transform: translateY(-1px); box-shadow: 0 8px 20px -4px rgba(124, 58, 237, 0.4); }
.btn-primary:disabled { opacity: 0.6; cursor: wait; }

.btn-secondary {
  padding: 0.6rem 1.2rem;
  background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 0.625rem; color: #94a3b8; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
}
.btn-secondary:hover { background: rgba(30, 41, 59, 0.8); border-color: rgba(71, 85, 105, 0.6); }

/* Table */
.table-container {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem;
  overflow: hidden;
}

table { width: 100%; border-collapse: collapse; }

thead { background: rgba(30, 41, 59, 0.5); }
th { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
td { padding: 0.875rem 1rem; border-top: 1px solid rgba(71, 85, 105, 0.15); font-size: 0.875rem; }
tr:hover td { background: rgba(30, 41, 59, 0.3); }

.name-cell { display: flex; align-items: center; gap: 0.75rem; font-weight: 500; }
.platform-icon { width: 24px; height: 24px; border-radius: 4px; object-fit: cover; }
.slug-cell { color: #64748b; font-family: monospace; font-size: 0.8rem; }

.badge {
  display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
}
.badge-success { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.badge-info { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.badge-muted { background: rgba(71, 85, 105, 0.2); color: #64748b; }

.action-buttons { display: flex; gap: 0.5rem; }
.btn-icon {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 0.5rem; color: #94a3b8; cursor: pointer; transition: all 0.2s; font-size: 0.8rem;
}
.btn-icon:hover { background: rgba(30, 41, 59, 0.8); color: #f1f5f9; }
.btn-icon-danger:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}

.modal-card {
  background: #0f172a; border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 440px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-card h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 1.25rem; }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.form-group input {
  width: 100%; padding: 0.7rem 0.875rem;
  background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 0.625rem; color: #f1f5f9; font-size: 0.875rem; outline: none; transition: all 0.2s; box-sizing: border-box;
}
.form-group input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
.form-group input::placeholder { color: #475569; }

.error-text { color: #f87171; font-size: 0.8rem; margin: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }

/* Empty & Loading */
.loading-text { color: #64748b; padding: 2rem; text-align: center; }
.empty-state { text-align: center; padding: 4rem 2rem; color: #475569; }
.empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
.empty-state p { margin-bottom: 1.5rem; font-size: 1rem; }

@media (max-width: 640px) {
  table { font-size: 0.8rem; }
  th, td { padding: 0.6rem 0.5rem; }
  .slug-cell { display: none; }
}
</style>
