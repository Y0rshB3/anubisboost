<script setup>
import { ref, onMounted } from "vue";
import api from "@/config/api.config.js";

const docsUrl = ref("");
const loading = ref(true);
const error = ref("");
const copied = ref(false);

onMounted(async () => {
  try {
    const { data } = await api.get("/admin/docs-token");
    const backendUrl = `http://${window.location.hostname}:3000`;
    docsUrl.value = `${backendUrl}${data.data.url}`;
  } catch (err) {
    error.value = err.response?.data?.message || "Error loading docs";
  } finally {
    loading.value = false;
  }
});

function openDocs() {
  window.open(docsUrl.value, "_blank");
}

function copyUrl() {
  navigator.clipboard.writeText(docsUrl.value);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
}
</script>

<template>
  <div class="docs-page">
    <div class="docs-card">
      <div class="docs-icon">
        <i class="pi pi-code"></i>
      </div>
      <h1>API Documentation</h1>
      <p class="docs-desc">Documentación interactiva de todos los endpoints de AnubisBoost (Swagger/OpenAPI)</p>

      <div v-if="loading" class="docs-loading">
        <i class="pi pi-spin pi-spinner"></i> Generando token de acceso...
      </div>
      <div v-else-if="error" class="docs-error">{{ error }}</div>
      <div v-else class="docs-actions">
        <button class="btn-primary" @click="openDocs">
          <i class="pi pi-external-link"></i>
          Abrir Swagger UI
        </button>
        <button class="btn-secondary" @click="copyUrl">
          <i :class="copied ? 'pi pi-check' : 'pi pi-copy'"></i>
          {{ copied ? 'Copiado!' : 'Copiar URL' }}
        </button>
      </div>

      <div class="docs-info">
        <div class="info-item">
          <i class="pi pi-shield"></i>
          <span>El token expira en 15 minutos. Vuelve aquí para generar uno nuevo.</span>
        </div>
        <div class="info-item">
          <i class="pi pi-lock"></i>
          <span>Solo accesible para administradores autenticados.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.docs-page { display: flex; align-items: center; justify-content: center; min-height: 60vh; color: #f1f5f9; }

.docs-card {
  text-align: center; max-width: 500px; width: 100%;
  background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 1rem; padding: 2.5rem;
}

.docs-icon {
  width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 1.25rem;
  background: rgba(124, 58, 237, 0.15); color: #a78bfa;
  display: flex; align-items: center; justify-content: center; font-size: 1.75rem;
}

.docs-card h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem; }
.docs-desc { color: #64748b; font-size: 0.875rem; margin: 0 0 2rem; }

.docs-loading { color: #64748b; font-size: 0.9rem; }
.docs-error { color: #f87171; font-size: 0.9rem; }

.docs-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }

.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.85rem 1.5rem; background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none; border-radius: 0.75rem; color: white; font-size: 1rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4); }

.btn-secondary {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.7rem 1.25rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.75rem;
  color: #94a3b8; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;
}
.btn-secondary:hover { background: rgba(30, 41, 59, 0.8); color: #f1f5f9; }

.docs-info { display: flex; flex-direction: column; gap: 0.5rem; }
.info-item { display: flex; align-items: center; gap: 0.5rem; color: #475569; font-size: 0.8rem; }
.info-item i { font-size: 0.75rem; color: #64748b; }
</style>
