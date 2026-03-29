<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/config/api.config.js";

const { t } = useI18n();
const faqs = ref([]);
const loading = ref(true);
const openId = ref(null);

onMounted(async () => {
  try {
    const { data } = await api.get("/faqs/admin");
    faqs.value = data.data;
  } finally { loading.value = false; }
});
</script>

<template>
  <div class="guide-page">
    <h1>{{ t('faq.admin_guide') }}</h1>

    <div v-if="loading" class="text-slate-500">{{ t('common.loading') }}</div>
    <div v-else-if="!faqs.length" class="text-slate-500 text-center py-12">{{ t('faq.no_faqs') }}</div>
    <div v-else class="faq-list">
      <div v-for="(faq, i) in faqs" :key="faq.id" class="guide-item" :class="{ open: openId === faq.id }">
        <button class="guide-question" @click="openId = openId === faq.id ? null : faq.id">
          <div class="guide-num">{{ i + 1 }}</div>
          <span>{{ faq.question }}</span>
          <i :class="openId === faq.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="guide-chevron"></i>
        </button>
        <div v-if="openId === faq.id" class="guide-answer">
          <p v-for="(line, idx) in faq.answer.split('\n')" :key="idx" :class="{ 'step-line': line.match(/^\d+\./) }">{{ line }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-page { max-width: 800px; color: #f1f5f9; }
.guide-page h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }

.faq-list { display: flex; flex-direction: column; gap: 0.5rem; }
.guide-item {
  background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.75rem; overflow: hidden; transition: border-color 0.2s;
}
.guide-item.open { border-color: rgba(124, 58, 237, 0.3); }
.guide-question {
  width: 100%; display: flex; align-items: center; gap: 0.875rem;
  padding: 1rem 1.25rem; background: none; border: none;
  color: #f1f5f9; font-size: 0.9rem; font-weight: 500; cursor: pointer; text-align: left;
}
.guide-num {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: rgba(124, 58, 237, 0.15); color: #a78bfa;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700;
}
.guide-chevron { color: #64748b; font-size: 0.75rem; margin-left: auto; flex-shrink: 0; }
.guide-answer {
  padding: 0 1.25rem 1.25rem 3.75rem; color: #94a3b8; font-size: 0.85rem; line-height: 1.7;
  border-top: 1px solid rgba(71, 85, 105, 0.15);
}
.guide-answer p { margin: 0.3rem 0; }
.step-line { color: #e2e8f0; font-weight: 500; }
</style>
