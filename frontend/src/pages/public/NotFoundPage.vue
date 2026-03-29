<script setup>
import Button from "primevue/button";
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="text-center">
      <h1 class="text-8xl font-bold text-brand-500">404</h1>
      <p class="text-slate-400 text-xl mt-4">Page not found</p>
      <Button label="Go Home" icon="pi pi-home" class="mt-6" severity="help" @click="router.push('/')" />
    </div>
  </div>
</template>
