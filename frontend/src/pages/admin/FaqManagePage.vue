<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import { useToast } from "primevue/usetoast";

const { t } = useI18n();
const toast = useToast();
const faqs = ref([]);
const loading = ref(true);
const showForm = ref(false);
const editingId = ref(null);
const form = ref({ question: "", answer: "", category: "client", sort_order: 0 });
const saving = ref(false);
const activeTab = ref("client");

const filteredFaqs = computed(() => faqs.value.filter(f => f.category === activeTab.value));

async function fetchFaqs() {
  loading.value = true;
  try {
    const { data } = await api.get("/faqs");
    faqs.value = data.data;
  } finally { loading.value = false; }
}

function openCreate(category) {
  editingId.value = null;
  form.value = { question: "", answer: "", category, sort_order: filteredFaqs.value.length };
  showForm.value = true;
}

function openEdit(faq) {
  editingId.value = faq.id;
  form.value = { question: faq.question, answer: faq.answer, category: faq.category, sort_order: faq.sort_order };
  showForm.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editingId.value) await api.patch(`/faqs/${editingId.value}`, form.value);
    else await api.post("/faqs", form.value);
    showForm.value = false;
    toast.add({ severity: "success", summary: "OK", life: 3000 });
    fetchFaqs();
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: err.response?.data?.message || "Error", life: 5000 });
  } finally { saving.value = false; }
}

async function deleteFaq(id) {
  await api.delete(`/faqs/${id}`);
  toast.add({ severity: "success", summary: t("common.delete"), life: 3000 });
  fetchFaqs();
}

onMounted(fetchFaqs);
</script>

<template>
  <div class="faq-manage">
    <div class="page-header">
      <h1>{{ t('faq.manage') }}</h1>
      <button class="btn-primary" @click="openCreate(activeTab)">
        <i class="pi pi-plus"></i> {{ t('faq.add') }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'client' }]" @click="activeTab = 'client'">
        <i class="pi pi-users"></i> {{ t('faq.for_clients') }}
      </button>
      <button :class="['tab', { active: activeTab === 'admin' }]" @click="activeTab = 'admin'">
        <i class="pi pi-cog"></i> {{ t('faq.for_admins') }}
      </button>
    </div>

    <!-- Admin guide preview link -->
    <div v-if="activeTab === 'admin'" class="guide-note">
      <i class="pi pi-info-circle"></i>
      Estas preguntas aparecen en la sección "{{ t('faq.admin_guide') }}" del panel de administración.
    </div>

    <!-- Form modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-card">
        <h2>{{ editingId ? t('faq.edit') : t('faq.add') }}</h2>
        <form @submit.prevent="save" class="modal-form">
          <div class="form-group">
            <label>{{ t('faq.category') }}</label>
            <select v-model="form.category" class="form-select">
              <option value="client">{{ t('faq.for_clients') }}</option>
              <option value="admin">{{ t('faq.for_admins') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('faq.question') }}</label>
            <input v-model="form.question" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ t('faq.answer') }}</label>
            <textarea v-model="form.answer" rows="5" required></textarea>
            <span class="form-hint">Usa Enter para separar líneas</span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showForm = false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <i v-if="saving" class="pi pi-spin pi-spinner"></i>
              {{ editingId ? t('common.update') : t('common.create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- FAQ list -->
    <div v-if="loading" class="text-slate-500 py-8 text-center">{{ t('common.loading') }}</div>
    <div v-else-if="!filteredFaqs.length" class="empty-state">
      <i class="pi pi-question-circle"></i>
      <p>{{ t('faq.no_faqs') }}</p>
    </div>
    <div v-else class="faq-list">
      <div v-for="faq in filteredFaqs" :key="faq.id" class="faq-row">
        <div class="faq-content">
          <p class="faq-q">{{ faq.question }}</p>
          <p class="faq-a">{{ faq.answer.slice(0, 100) }}{{ faq.answer.length > 100 ? '...' : '' }}</p>
        </div>
        <div class="faq-actions">
          <button class="btn-icon" @click="openEdit(faq)"><i class="pi pi-pencil"></i></button>
          <button class="btn-icon btn-icon-danger" @click="deleteFaq(faq.id)"><i class="pi pi-trash"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq-manage { color: #f1f5f9; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }

.tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 1rem; background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 0.625rem;
  color: #94a3b8; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
}
.tab:hover { border-color: rgba(71, 85, 105, 0.5); }
.tab.active { background: rgba(124, 58, 237, 0.15); border-color: #7c3aed; color: #c4b5fd; }

.guide-note { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.8rem; margin-bottom: 1rem; padding: 0.5rem 0.75rem; background: rgba(30, 41, 59, 0.3); border-radius: 0.5rem; }

.faq-list { display: flex; flex-direction: column; gap: 0.5rem; }
.faq-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.15); border-radius: 0.75rem;
}
.faq-content { flex: 1; min-width: 0; }
.faq-q { font-weight: 600; font-size: 0.875rem; margin: 0 0 0.25rem; }
.faq-a { color: #64748b; font-size: 0.8rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.faq-actions { display: flex; gap: 0.5rem; flex-shrink: 0; margin-left: 1rem; }

.btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: 0.625rem; color: white; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; }
.btn-secondary { padding: 0.6rem 1.2rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem; color: #94a3b8; font-size: 0.875rem; cursor: pointer; }
.btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 0.5rem; color: #94a3b8; cursor: pointer; font-size: 0.8rem; }
.btn-icon:hover { background: rgba(30, 41, 59, 0.8); color: #f1f5f9; }
.btn-icon-danger:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.empty-state { text-align: center; padding: 3rem 2rem; color: #475569; }
.empty-state i { font-size: 3rem; display: block; margin-bottom: 1rem; }

.modal-overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-card { background: #0f172a; border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 540px; }
.modal-card h2 { font-size: 1.25rem; font-weight: 700; margin: 0 0 1.25rem; }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.form-group input, .form-group textarea, .form-select {
  width: 100%; padding: 0.7rem 0.875rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem;
  color: #f1f5f9; font-size: 0.875rem; outline: none; box-sizing: border-box; font-family: inherit; resize: vertical;
}
.form-group input:focus, .form-group textarea:focus, .form-select:focus { border-color: #7c3aed; }
.form-hint { font-size: 0.7rem; color: #475569; margin-top: 0.25rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
</style>
