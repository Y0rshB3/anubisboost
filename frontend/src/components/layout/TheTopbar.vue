<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store.js";
import { useNotificationStore } from "@/stores/notification.store.js";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { setLocale } from "@/i18n/index.js";
import { useToast } from "primevue/usetoast";

const { locale, t } = useI18n();
const auth = useAuthStore();
const notifs = useNotificationStore();
const router = useRouter();
const toast = useToast();
const showLangMenu = ref(false);

onMounted(() => {
  notifs.setToastCallback((opts) => toast.add(opts));
  notifs.fetch();
});

defineEmits(["toggle-sidebar"]);

const languages = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

function switchLang(code) {
  setLocale(code);
  showLangMenu.value = false;
}

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>

<template>
  <header class="topbar">
    <button class="topbar-toggle" @click="$emit('toggle-sidebar')">
      <i class="pi pi-bars"></i>
    </button>
    <div class="topbar-spacer"></div>

    <!-- Language selector -->
    <div class="lang-selector">
      <button class="lang-btn" @click="showLangMenu = !showLangMenu">
        {{ languages.find(l => l.code === locale)?.flag || '🌐' }}
        <i class="pi pi-chevron-down" style="font-size: 0.6rem"></i>
      </button>
      <div v-if="showLangMenu" class="lang-dropdown" @mouseleave="showLangMenu = false">
        <button v-for="lang in languages" :key="lang.code"
                :class="['lang-option', { active: locale === lang.code }]"
                @click="switchLang(lang.code)">
          <span>{{ lang.flag }}</span>
          <span>{{ lang.label }}</span>
          <i v-if="locale === lang.code" class="pi pi-check" style="font-size: 0.7rem; color: #a78bfa"></i>
        </button>
      </div>
    </div>

    <!-- Notifications -->
    <button class="notif-btn" @click="router.push(`/${auth.user?.role === 'collaborator' ? 'collaborator' : auth.user?.role || 'client'}/notifications`)">
      <i class="pi pi-bell"></i>
      <span v-if="notifs.unreadCount" class="notif-badge">
        {{ notifs.unreadCount > 9 ? '9+' : notifs.unreadCount }}
      </span>
    </button>

    <!-- User (click to go to profile) -->
    <div class="user-info" @click="router.push(`/${auth.user?.role || 'client'}/profile`)" style="cursor: pointer;">
      <div class="user-avatar">{{ auth.user?.username?.[0]?.toUpperCase() || '?' }}</div>
      <span class="user-name">{{ auth.user?.username }}</span>
    </div>

    <button class="logout-btn" @click="logout" :title="t('common.sign_out')">
      <i class="pi pi-sign-out"></i>
    </button>
  </header>
</template>

<style scoped>
.topbar {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(71, 85, 105, 0.2);
}
.topbar-toggle { display: none; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; padding: 0.5rem; }
.topbar-spacer { flex: 1; }

/* Language */
.lang-selector { position: relative; }
.lang-btn {
  display: flex; align-items: center; gap: 0.35rem;
  background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 0.5rem; padding: 0.4rem 0.6rem; cursor: pointer; color: #94a3b8; font-size: 0.9rem;
  transition: all 0.2s;
}
.lang-btn:hover { background: rgba(30, 41, 59, 0.8); }
.lang-dropdown {
  position: absolute; top: calc(100% + 0.5rem); right: 0;
  background: #1e293b; border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 0.625rem; overflow: hidden; min-width: 150px; z-index: 50;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
}
.lang-option {
  display: flex; align-items: center; gap: 0.5rem; width: 100%;
  padding: 0.6rem 0.875rem; background: none; border: none; color: #cbd5e1;
  cursor: pointer; font-size: 0.85rem; transition: background 0.15s;
}
.lang-option:hover { background: rgba(71, 85, 105, 0.2); }
.lang-option.active { background: rgba(124, 58, 237, 0.1); }

/* Notifications */
.notif-btn {
  position: relative; background: none; border: none; color: #94a3b8;
  cursor: pointer; padding: 0.5rem; font-size: 1.1rem; transition: color 0.2s;
}
.notif-btn:hover { color: #f1f5f9; }
.notif-badge {
  position: absolute; top: 0; right: 0;
  width: 18px; height: 18px; background: #7c3aed; border-radius: 50%;
  font-size: 0.65rem; display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700;
}

/* User */
.user-info { display: flex; align-items: center; gap: 0.5rem; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; color: white;
}
.user-name { font-size: 0.85rem; color: #cbd5e1; }

.logout-btn {
  background: none; border: none; color: #64748b; cursor: pointer;
  padding: 0.5rem; font-size: 0.95rem; transition: color 0.2s;
}
.logout-btn:hover { color: #f87171; }

@media (max-width: 768px) {
  .topbar-toggle { display: block; }
  .user-name { display: none; }
}
</style>
