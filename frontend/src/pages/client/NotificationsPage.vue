<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth.store.js";
import { useNotificationStore } from "@/stores/notification.store.js";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const store = useNotificationStore();

onMounted(() => store.fetch());

function handleClick(n) {
  store.markRead(n.id);
  const route = store.resolveRoute(n, auth.user?.role);
  if (route) router.push(route);
}

function getIcon(type) {
  if (type?.includes("chat")) return "pi-comments";
  if (type?.includes("status")) return "pi-refresh";
  if (type?.includes("order")) return "pi-shopping-cart";
  return "pi-bell";
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
</script>

<template>
  <div class="notif-page">
    <div class="page-header">
      <h1>{{ t('notifications.title') }}</h1>
      <div class="header-actions">
        <button v-if="store.unreadCount" class="btn-text" @click="store.markAllRead()">
          <i class="pi pi-check-circle"></i> {{ t('notifications.mark_all_read') }}
        </button>
        <button v-if="store.notifications.length" class="btn-text btn-danger" @click="store.clearAll()">
          <i class="pi pi-trash"></i> {{ t('notifications.clear_all') }}
        </button>
      </div>
    </div>

    <div v-if="store.isLoading" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
    <div v-else-if="!store.notifications.length" class="empty-state">
      <i class="pi pi-bell-slash"></i>
      <p>{{ t('notifications.no_notifications') }}</p>
    </div>

    <div v-else class="notif-list">
      <div v-for="n in store.notifications" :key="n.id"
           :class="['notif-item', { unread: !n.read_at }]"
           @click="handleClick(n)">
        <div class="notif-icon-wrap" :class="{ unread: !n.read_at }">
          <i :class="['pi', getIcon(n.type)]"></i>
        </div>
        <div class="notif-content">
          <p class="notif-title">{{ n.title }}</p>
          <p v-if="n.body" class="notif-body">{{ n.body }}</p>
          <div class="notif-meta">
            <span class="notif-time">{{ timeAgo(n.created_at) }}</span>
            <span v-if="!n.read_at" class="unread-dot"></span>
          </div>
        </div>
        <button class="notif-delete" @click.stop="store.remove(n.id)" title="Delete">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-page { max-width: 700px; color: #f1f5f9; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;
}
.page-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
.header-actions { display: flex; gap: 0.75rem; }

.btn-text {
  display: flex; align-items: center; gap: 0.4rem;
  background: none; border: none; color: #94a3b8;
  font-size: 0.8rem; cursor: pointer; padding: 0.4rem 0.6rem;
  border-radius: 0.5rem; transition: all 0.2s;
}
.btn-text:hover { background: rgba(30, 41, 59, 0.5); color: #f1f5f9; }
.btn-danger:hover { color: #f87171; }

.empty-state {
  text-align: center; padding: 4rem 2rem; color: #475569;
}
.empty-state i { font-size: 3rem; display: block; margin-bottom: 1rem; }

.notif-list { display: flex; flex-direction: column; gap: 0.5rem; }

.notif-item {
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.15);
  border-radius: 0.75rem;
  cursor: pointer; transition: all 0.2s;
}
.notif-item:hover { background: rgba(30, 41, 59, 0.5); border-color: rgba(71, 85, 105, 0.3); }
.notif-item.unread {
  background: rgba(124, 58, 237, 0.05);
  border-color: rgba(124, 58, 237, 0.15);
}

.notif-icon-wrap {
  width: 38px; height: 38px; border-radius: 0.625rem; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(30, 41, 59, 0.5); color: #64748b; font-size: 0.9rem;
}
.notif-icon-wrap.unread { background: rgba(124, 58, 237, 0.15); color: #a78bfa; }

.notif-content { flex: 1; min-width: 0; }
.notif-title { font-size: 0.875rem; font-weight: 500; margin: 0; color: #e2e8f0; }
.notif-body { font-size: 0.8rem; color: #64748b; margin: 0.25rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.35rem; }
.notif-time { font-size: 0.7rem; color: #475569; }

.unread-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #7c3aed;
}

.notif-delete {
  background: none; border: none; color: #475569; cursor: pointer;
  padding: 0.35rem; border-radius: 0.375rem; font-size: 0.75rem;
  opacity: 0; transition: all 0.2s; flex-shrink: 0;
}
.notif-item:hover .notif-delete { opacity: 1; }
.notif-delete:hover { color: #f87171; background: rgba(239, 68, 68, 0.1); }

@media (max-width: 640px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .notif-delete { opacity: 1; }
}
</style>
