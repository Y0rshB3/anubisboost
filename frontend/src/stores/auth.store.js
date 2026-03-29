import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/config/api.config.js";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isClient = computed(() => user.value?.role === "client");
  const isCollaborator = computed(() => user.value?.role === "collaborator");

  async function login(email, password) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.post("/auth/login", { email, password });
      // 2FA required
      if (data.data.requires2FA) {
        return { requires2FA: true, userId: data.data.userId, destination: data.data.destination, method: data.data.method };
      }
      localStorage.setItem("access_token", data.data.accessToken);
      localStorage.setItem("refresh_token", data.data.refreshToken);
      await fetchProfile();
      return user.value;
    } catch (err) {
      error.value = err.response?.data?.message || "Login failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function verify2FA(userId, code) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.post("/auth/verify-2fa", { userId, code });
      localStorage.setItem("access_token", data.data.accessToken);
      localStorage.setItem("refresh_token", data.data.refreshToken);
      await fetchProfile();
      return user.value;
    } catch (err) {
      error.value = err.response?.data?.message || "Invalid code";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(email, username, password) {
    isLoading.value = true;
    error.value = null;
    try {
      const { data } = await api.post("/auth/register", { email, username, password });
      localStorage.setItem("access_token", data.data.accessToken);
      localStorage.setItem("refresh_token", data.data.refreshToken);
      await fetchProfile();
      return user.value;
    } catch (err) {
      error.value = err.response?.data?.message || "Registration failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProfile() {
    try {
      const { data } = await api.get("/auth/me");
      user.value = data.data;
    } catch {
      user.value = null;
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout", { refreshToken: localStorage.getItem("refresh_token") });
    } catch { /* ignore */ }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    user.value = null;
  }

  function initFromStorage() {
    if (localStorage.getItem("access_token")) return fetchProfile();
  }

  return { user, isLoading, error, isAuthenticated, isAdmin, isClient, isCollaborator, login, verify2FA, register, logout, fetchProfile, initFromStorage };
});
