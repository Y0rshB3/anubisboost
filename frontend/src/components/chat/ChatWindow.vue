<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth.store.js";
import { useChatStore } from "@/stores/chat.store.js";
import { createSocket } from "@/config/socket.config.js";
import api from "@/config/api.config.js";

const { t } = useI18n();

const props = defineProps({ orderId: { type: String, required: true } });
const auth = useAuthStore();
const chatStore = useChatStore();
const message = ref("");
const messagesEl = ref(null);
const fileInput = ref(null);
const uploading = ref(false);
let socket = null;

function scrollToBottom() {
  nextTick(() => { if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight; });
}

onMounted(async () => {
  await chatStore.fetchMessages(props.orderId);
  scrollToBottom();

  const token = localStorage.getItem("access_token");
  socket = createSocket("/orders", token);
  socket.connect();
  socket.emit("join_order", { orderId: Number(props.orderId) });

  socket.on("chat:message", (msg) => {
    chatStore.addMessage(props.orderId, msg);
    scrollToBottom();
  });
});

onUnmounted(() => {
  if (socket) {
    socket.emit("leave_order", { orderId: Number(props.orderId) });
    socket.disconnect();
  }
});

function send() {
  if (!message.value.trim() || !socket) return;
  socket.emit("chat:send", { orderId: Number(props.orderId), message: message.value, type: "text" });
  message.value = "";
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Send image URL as chat message
    socket.emit("chat:send", {
      orderId: Number(props.orderId),
      message: data.data.url,
      type: "image",
    });
  } catch {
    alert("Error uploading image");
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

function isImage(msg) {
  return msg.message_type === "image";
}

const messages = ref([]);
watch(() => chatStore.getMessages(props.orderId), (val) => { messages.value = val; }, { deep: true, immediate: true });
</script>

<template>
  <div class="chat-window">
    <div class="chat-header">
      <i class="pi pi-comments"></i>
      {{ t('chat.title') }}
    </div>

    <div ref="messagesEl" class="chat-messages">
      <div v-if="!messages.length" class="chat-empty">
        <i class="pi pi-comments"></i>
        <p>{{ t('chat.no_messages') }}</p>
      </div>
      <div v-for="msg in messages" :key="msg.id" :class="['msg-row', { own: msg.sender_id === auth.user?.id }]">
        <div :class="['msg-bubble', { own: msg.sender_id === auth.user?.id }]">
          <span class="msg-sender">{{ msg.sender_name }}</span>
          <img v-if="isImage(msg)" :src="msg.message" class="msg-image" @click="window.open(msg.message, '_blank')" />
          <p v-else class="msg-text">{{ msg.message }}</p>
          <span class="msg-time">{{ new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
      </div>
    </div>

    <form @submit.prevent="send" class="chat-input">
      <input ref="fileInput" type="file" accept="image/*" hidden @change="handleImageUpload" />
      <button type="button" class="btn-attach" @click="fileInput?.click()" :disabled="uploading" :title="t('games.cover_upload')">
        <i :class="uploading ? 'pi pi-spin pi-spinner' : 'pi pi-image'"></i>
      </button>
      <input v-model="message" :placeholder="t('chat.type_message')" class="chat-text-input" />
      <button type="submit" class="btn-send" :disabled="!message.trim()">
        <i class="pi pi-send"></i>
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat-window {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 0.875rem;
  display: flex;
  flex-direction: column;
  height: 500px;
  overflow: hidden;
}

.chat-header {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgba(71, 85, 105, 0.2);
  font-weight: 600;
  font-size: 0.875rem;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
  gap: 0.5rem;
}
.chat-empty i { font-size: 2rem; }
.chat-empty p { font-size: 0.85rem; }

.msg-row { display: flex; }
.msg-row.own { justify-content: flex-end; }

.msg-bubble {
  max-width: 80%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.2);
}

.msg-bubble.own {
  background: rgba(124, 58, 237, 0.25);
  border-color: rgba(124, 58, 237, 0.3);
}

.msg-sender {
  display: block;
  font-size: 0.7rem;
  color: #a78bfa;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.msg-bubble.own .msg-sender { color: #c4b5fd; }

.msg-text {
  font-size: 0.85rem;
  color: #e2e8f0;
  margin: 0;
  word-wrap: break-word;
}

.msg-image {
  max-width: 250px;
  max-height: 200px;
  border-radius: 0.5rem;
  cursor: pointer;
  margin: 0.25rem 0;
  object-fit: cover;
}

.msg-time {
  display: block;
  font-size: 0.6rem;
  color: #475569;
  text-align: right;
  margin-top: 0.2rem;
}

/* Input */
.chat-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(71, 85, 105, 0.2);
}

.chat-text-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(71, 85, 105, 0.3);
  border-radius: 0.625rem;
  color: #f1f5f9;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s;
}
.chat-text-input:focus { border-color: #7c3aed; }
.chat-text-input::placeholder { color: #475569; }

.btn-attach, .btn-send {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-attach {
  background: rgba(30, 41, 59, 0.5);
  color: #94a3b8;
}
.btn-attach:hover:not(:disabled) { background: rgba(30, 41, 59, 0.8); color: #f1f5f9; }
.btn-attach:disabled { opacity: 0.5; cursor: wait; }

.btn-send {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
}
.btn-send:hover:not(:disabled) { transform: scale(1.05); }
.btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
