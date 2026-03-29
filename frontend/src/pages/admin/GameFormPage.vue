<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";
import { useToast } from "primevue/usetoast";

const { t, te } = useI18n();
const toast = useToast();

function tName(slug, fallback) {
  const key = `platform_names.${slug}`;
  return te(key) ? t(key) : fallback;
}
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const platforms = ref([]);
const imagePreview = ref(null);
const fileInput = ref(null);
const uploading = ref(false);

const form = ref({ name: "", description: "", cover_url: "", platform_ids: [] });

onMounted(async () => {
  const { data: pData } = await api.get("/catalog/platforms");
  platforms.value = pData.data;

  if (isEdit.value) {
    const { data } = await api.get(`/catalog/games/${route.params.id}`);
    const g = data.data;
    form.value = {
      name: g.name,
      description: g.description || "",
      cover_url: g.cover_url || "",
      platform_ids: g.platform_ids ? g.platform_ids.split(",").map(Number) : [],
    };
    if (g.cover_url) imagePreview.value = g.cover_url;
  }
});

function triggerUpload() {
  fileInput.value?.click();
}

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Preview
  const reader = new FileReader();
  reader.onload = (e) => { imagePreview.value = e.target.result; };
  reader.readAsDataURL(file);

  // Upload
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    form.value.cover_url = data.data.url;
  } catch (err) {
    alert("Error uploading image");
    imagePreview.value = null;
  } finally {
    uploading.value = false;
  }
}

function togglePlatform(id) {
  const idx = form.value.platform_ids.indexOf(id);
  if (idx >= 0) form.value.platform_ids.splice(idx, 1);
  else form.value.platform_ids.push(id);
}

async function save() {
  loading.value = true;
  try {
    if (isEdit.value) await api.patch(`/catalog/games/${route.params.id}`, form.value);
    else await api.post("/catalog/games", form.value);
    toast.add({ severity: "success", summary: isEdit.value ? t("common.update") : t("common.create"), life: 3000 });
    router.push("/admin/games");
  } finally { loading.value = false; }
}
</script>

<template>
  <div class="game-form-page">
    <nav class="breadcrumb">
      <router-link to="/admin/games" class="breadcrumb-link">{{ t('breadcrumb.games') }}</router-link>
      <i class="pi pi-angle-right breadcrumb-sep" />
      <span class="breadcrumb-current">{{ isEdit ? t('breadcrumb.edit_game') : t('breadcrumb.create_game') }}</span>
    </nav>
    <h1>{{ isEdit ? t('games.edit_game') : t('games.create_game') }}</h1>

    <form @submit.prevent="save" class="form-card">
      <div class="form-group">
        <label>{{ t('games.name') }}</label>
        <input v-model="form.name" type="text" required />
      </div>

      <div class="form-group">
        <label>{{ t('common.description') }}</label>
        <textarea v-model="form.description" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>{{ t('games.cover') }}</label>
        <div class="upload-area" @click="triggerUpload">
          <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" hidden />
          <div v-if="imagePreview" class="upload-preview">
            <img :src="imagePreview" alt="Cover preview" />
            <div class="upload-overlay">
              <i class="pi pi-camera"></i>
              <span>{{ t('games.cover_change') }}</span>
            </div>
          </div>
          <div v-else class="upload-placeholder">
            <i v-if="uploading" class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
            <template v-else>
              <i class="pi pi-cloud-upload" style="font-size: 2rem"></i>
              <span>{{ t('games.cover_upload') }}</span>
              <span class="upload-hint">JPG, PNG, WebP (max 5MB)</span>
            </template>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>{{ t('games.platforms') }}</label>
        <div class="platform-grid">
          <button v-for="p in platforms" :key="p.id" type="button"
                  :class="['platform-chip', { selected: form.platform_ids.includes(p.id) }]"
                  @click="togglePlatform(p.id)">
            <i :class="form.platform_ids.includes(p.id) ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
            {{ tName(p.slug, p.name) }}
          </button>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          <i v-if="loading" class="pi pi-spin pi-spinner"></i>
          {{ isEdit ? t('common.update') : t('common.create') }}
        </button>
        <button type="button" class="btn-secondary" @click="router.back()">{{ t('common.cancel') }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Breadcrumb */
.breadcrumb {
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

.game-form-page { max-width: 600px; color: #f1f5f9; }
.game-form-page h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }

.form-card {
  background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
}

.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.form-group input, .form-group textarea {
  width: 100%; padding: 0.7rem 0.875rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem;
  color: #f1f5f9; font-size: 0.875rem; outline: none; transition: all 0.2s;
  font-family: inherit; box-sizing: border-box; resize: vertical;
}
.form-group input:focus, .form-group textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }

/* Upload area */
.upload-area {
  border: 2px dashed rgba(71, 85, 105, 0.4); border-radius: 0.75rem;
  cursor: pointer; overflow: hidden; transition: all 0.2s;
}
.upload-area:hover { border-color: #7c3aed; }

.upload-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 2rem; gap: 0.5rem; color: #64748b;
}
.upload-hint { font-size: 0.75rem; color: #475569; }

.upload-preview { position: relative; }
.upload-preview img { width: 100%; height: 200px; object-fit: cover; display: block; }
.upload-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; color: white; opacity: 0; transition: opacity 0.2s;
}
.upload-area:hover .upload-overlay { opacity: 1; }

/* Platform chips */
.platform-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.platform-chip {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 0.875rem; background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 999px;
  color: #94a3b8; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
}
.platform-chip:hover { border-color: #7c3aed; color: #c4b5fd; }
.platform-chip.selected { background: rgba(124, 58, 237, 0.15); border-color: #7c3aed; color: #c4b5fd; }

/* Actions */
.form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.5rem; background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none; border-radius: 0.625rem; color: white; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px -4px rgba(124, 58, 237, 0.4); }
.btn-primary:disabled { opacity: 0.6; cursor: wait; }
.btn-secondary {
  padding: 0.7rem 1.5rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem;
  color: #94a3b8; font-size: 0.875rem; cursor: pointer;
}
.btn-secondary:hover { background: rgba(30, 41, 59, 0.8); }
</style>
