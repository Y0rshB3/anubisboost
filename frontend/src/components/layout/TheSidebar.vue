<script setup>
import { useRouter } from "vue-router";

defineProps({ items: Array, open: Boolean, variant: { type: String, default: "default" } });
function tourId(to) {
  const parts = to.split("/").filter(Boolean);
  return `tour-${parts.join("-")}`;
}
defineEmits(["toggle"]);
const router = useRouter();
</script>

<template>
  <aside :class="['transition-all duration-300 flex flex-col border-r border-slate-800 bg-slate-900', open ? 'w-64' : 'w-16']">
    <div class="flex items-center justify-between p-4 border-b border-slate-800">
      <span v-if="open" class="text-lg font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
        AnubisBoost
      </span>
      <button @click="$emit('toggle')" class="p-2 rounded hover:bg-slate-800 text-slate-400">
        <i :class="open ? 'pi pi-angle-left' : 'pi pi-angle-right'" />
      </button>
    </div>
    <nav class="flex-1 py-4 space-y-1">
      <router-link
        v-for="item in items" :key="item.to" :to="item.to"
        :data-tour="tourId(item.to)"
        class="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        active-class="!bg-brand-600/20 !text-brand-400"
      >
        <i :class="item.icon" class="text-lg" />
        <span v-if="open" class="text-sm font-medium">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>
