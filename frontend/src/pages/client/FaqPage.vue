<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";

const { t } = useI18n();
const faqs = ref([]);
const loading = ref(true);
const openId = ref(null);

const steps = [
  { icon: "pi-search", color: "#3b82f6", key: "step_1" },
  { icon: "pi-send", color: "#8b5cf6", key: "step_2" },
  { icon: "pi-credit-card", color: "#f59e0b", key: "step_3" },
  { icon: "pi-lock", color: "#ef4444", key: "step_4" },
  { icon: "pi-spin pi-cog", color: "#10b981", key: "step_5" },
  { icon: "pi-check-circle", color: "#22c55e", key: "step_6" },
];

onMounted(async () => {
  try {
    const { data } = await api.get("/faqs/client");
    faqs.value = data.data;
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="faq-page">
    <!-- Steps -->
    <div class="steps-section">
      <h1>{{ t('faq.how_it_works') }}</h1>
      <p class="steps-subtitle">{{ t('faq.steps_title') }}</p>
      <div class="steps-grid">
        <div v-for="(step, i) in steps" :key="i" class="step-card">
          <div class="step-number" :style="{ background: step.color + '20', color: step.color }">{{ i + 1 }}</div>
          <div class="step-icon" :style="{ color: step.color }"><i :class="['pi', step.icon]"></i></div>
          <h3>{{ t(`faq.${step.key}_title`) }}</h3>
          <p>{{ t(`faq.${step.key}_desc`) }}</p>
        </div>
      </div>
    </div>

    <!-- FAQs -->
    <div class="faq-section">
      <h2>{{ t('faq.title') }}</h2>
      <div v-if="loading" class="text-slate-500">{{ t('common.loading') }}</div>
      <div v-else-if="!faqs.length" class="text-slate-500">{{ t('faq.no_faqs') }}</div>
      <div v-else class="faq-list">
        <div v-for="faq in faqs" :key="faq.id" class="faq-item" :class="{ open: openId === faq.id }">
          <button class="faq-question" @click="openId = openId === faq.id ? null : faq.id">
            <span>{{ faq.question }}</span>
            <i :class="openId === faq.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          </button>
          <div v-if="openId === faq.id" class="faq-answer">
            <p v-for="(line, idx) in faq.answer.split('\n')" :key="idx">{{ line }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.faq-page { max-width: 900px; color: #f1f5f9; }

.steps-section { margin-bottom: 3rem; }
.steps-section h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; }
.steps-subtitle { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }

.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.step-card {
  background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem; padding: 1.25rem; position: relative;
}
.step-number {
  position: absolute; top: -0.5rem; right: 1rem;
  width: 28px; height: 28px; border-radius: 50%;
  font-size: 0.75rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.step-icon { font-size: 1.5rem; margin-bottom: 0.75rem; }
.step-card h3 { font-size: 0.9rem; font-weight: 700; margin: 0 0 0.4rem; }
.step-card p { font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4; }

.faq-section { }
.faq-section h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.25rem; }

.faq-list { display: flex; flex-direction: column; gap: 0.5rem; }
.faq-item {
  background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.75rem; overflow: hidden; transition: border-color 0.2s;
}
.faq-item.open { border-color: rgba(124, 58, 237, 0.3); }
.faq-question {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; background: none; border: none;
  color: #f1f5f9; font-size: 0.9rem; font-weight: 500;
  cursor: pointer; text-align: left;
}
.faq-question i { color: #64748b; font-size: 0.75rem; flex-shrink: 0; }
.faq-answer {
  padding: 0 1.25rem 1rem; color: #94a3b8; font-size: 0.85rem; line-height: 1.6;
  border-top: 1px solid rgba(71, 85, 105, 0.15);
}
.faq-answer p { margin: 0.4rem 0; }

@media (max-width: 768px) {
  .steps-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .steps-grid { grid-template-columns: 1fr; }
}
</style>
