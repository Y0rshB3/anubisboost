import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/config/api.config.js";

export const useChatStore = defineStore("chat", () => {
  const messages = ref({});
  const isLoading = ref(false);

  async function fetchMessages(orderId, params = {}) {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/orders/${orderId}/chat/messages`, { params });
      messages.value[orderId] = data.data;
    } finally {
      isLoading.value = false;
    }
  }

  function addMessage(orderId, msg) {
    if (!messages.value[orderId]) messages.value[orderId] = [];
    messages.value[orderId].push(msg);
  }

  function getMessages(orderId) {
    return messages.value[orderId] || [];
  }

  return { messages, isLoading, fetchMessages, addMessage, getMessages };
});
