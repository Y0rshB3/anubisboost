<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  steps: { type: Array, required: true },
  storageKey: { type: String, required: true },
});

const emit = defineEmits(["complete"]);
const { t } = useI18n();

const active = ref(false);
const currentStep = ref(0);
const spotlightRect = ref(null);
const tooltipStyle = ref({});
const tooltipArrowClass = ref("");

const step = computed(() => props.steps[currentStep.value] || null);
const isFirst = computed(() => currentStep.value === 0);
const isLast = computed(() => currentStep.value === props.steps.length - 1);

function getElementRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

function positionTooltip() {
  if (!step.value) return;
  const rect = getElementRect(step.value.target);
  if (!rect) {
    spotlightRect.value = null;
    tooltipStyle.value = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    tooltipArrowClass.value = "";
    return;
  }

  const pad = 8;
  spotlightRect.value = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    borderRadius: "8px",
  };

  const pos = step.value.position || "bottom";
  const gap = 16;
  let style = {};

  if (pos === "bottom") {
    style = { top: `${rect.bottom + gap}px`, left: `${rect.left + rect.width / 2}px`, transform: "translateX(-50%)" };
    tooltipArrowClass.value = "arrow-top";
  } else if (pos === "top") {
    style = { bottom: `${window.innerHeight - rect.top + gap}px`, left: `${rect.left + rect.width / 2}px`, transform: "translateX(-50%)" };
    tooltipArrowClass.value = "arrow-bottom";
  } else if (pos === "right") {
    style = { top: `${rect.top + rect.height / 2}px`, left: `${rect.right + gap}px`, transform: "translateY(-50%)" };
    tooltipArrowClass.value = "arrow-left";
  } else if (pos === "left") {
    style = { top: `${rect.top + rect.height / 2}px`, right: `${window.innerWidth - rect.left + gap}px`, transform: "translateY(-50%)" };
    tooltipArrowClass.value = "arrow-right";
  }

  tooltipStyle.value = style;
}

function goNext() {
  if (isLast.value) {
    finish();
    return;
  }
  currentStep.value++;
  nextTick(positionTooltip);
}

function goPrev() {
  if (isFirst.value) return;
  currentStep.value--;
  nextTick(positionTooltip);
}

function skip() {
  finish();
}

function finish() {
  active.value = false;
  localStorage.setItem(props.storageKey, "true");
  emit("complete");
}

function handleResize() {
  if (active.value) positionTooltip();
}

onMounted(() => {
  const done = localStorage.getItem(props.storageKey);
  if (!done) {
    // Small delay to let the layout render
    setTimeout(() => {
      active.value = true;
      nextTick(positionTooltip);
    }, 600);
  }
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

watch(currentStep, () => {
  nextTick(positionTooltip);
});
</script>

<template>
  <teleport to="body">
    <div v-if="active" class="tour-overlay">
      <!-- Dark backdrop with spotlight cutout -->
      <svg class="tour-backdrop" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              v-if="spotlightRect"
              :x="spotlightRect.left"
              :y="spotlightRect.top"
              :width="spotlightRect.width"
              :height="spotlightRect.height"
              rx="8"
              ry="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(2, 6, 23, 0.82)"
          mask="url(#tour-mask)"
        />
      </svg>

      <!-- Spotlight ring -->
      <div
        v-if="spotlightRect"
        class="tour-spotlight-ring"
        :style="{
          top: spotlightRect.top + 'px',
          left: spotlightRect.left + 'px',
          width: spotlightRect.width + 'px',
          height: spotlightRect.height + 'px',
        }"
      />

      <!-- Tooltip card -->
      <div
        v-if="step"
        class="tour-tooltip"
        :class="tooltipArrowClass"
        :style="tooltipStyle"
      >
        <div class="tour-step-counter">
          {{ currentStep + 1 }} / {{ steps.length }}
        </div>
        <h3 class="tour-title">{{ step.title }}</h3>
        <p class="tour-desc">{{ step.description }}</p>
        <div class="tour-actions">
          <button class="tour-btn tour-btn-skip" @click="skip">
            {{ t('tour.skip') }}
          </button>
          <div class="tour-nav">
            <button
              v-if="!isFirst"
              class="tour-btn tour-btn-prev"
              @click="goPrev"
            >
              <i class="pi pi-arrow-left" />
              {{ t('tour.prev') }}
            </button>
            <button
              class="tour-btn tour-btn-next"
              @click="goNext"
            >
              {{ isLast ? t('tour.finish') : t('tour.next') }}
              <i v-if="!isLast" class="pi pi-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.tour-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.tour-spotlight-ring {
  position: absolute;
  border: 2px solid #7c3aed;
  border-radius: 8px;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.2), 0 0 24px rgba(124, 58, 237, 0.15);
  pointer-events: none;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.tour-tooltip {
  position: fixed;
  z-index: 10000;
  background: #0f172a;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 0.875rem;
  padding: 1.25rem;
  min-width: 280px;
  max-width: 360px;
  box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 0 24px rgba(124, 58, 237, 0.1);
  pointer-events: auto;
  animation: tourFadeIn 0.25s ease-out;
}

@keyframes tourFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Arrows */
.tour-tooltip.arrow-top::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid rgba(124, 58, 237, 0.3);
}
.tour-tooltip.arrow-top::after {
  content: "";
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid #0f172a;
}

.tour-tooltip.arrow-bottom::before {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(124, 58, 237, 0.3);
}
.tour-tooltip.arrow-bottom::after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #0f172a;
}

.tour-tooltip.arrow-left::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid rgba(124, 58, 237, 0.3);
}
.tour-tooltip.arrow-left::after {
  content: "";
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-right: 7px solid #0f172a;
}

.tour-tooltip.arrow-right::before {
  content: "";
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid rgba(124, 58, 237, 0.3);
}
.tour-tooltip.arrow-right::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 7px solid #0f172a;
}

.tour-step-counter {
  font-size: 0.7rem;
  color: #7c3aed;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.tour-title {
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.4rem;
}

.tour-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.tour-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tour-nav {
  display: flex;
  gap: 0.5rem;
}

.tour-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.tour-btn-skip {
  background: transparent;
  color: #64748b;
  padding-left: 0;
}
.tour-btn-skip:hover {
  color: #94a3b8;
}

.tour-btn-prev {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  color: #94a3b8;
}
.tour-btn-prev:hover {
  background: rgba(30, 41, 59, 0.8);
  color: #f1f5f9;
}

.tour-btn-next {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  font-weight: 600;
}
.tour-btn-next:hover {
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}
</style>
