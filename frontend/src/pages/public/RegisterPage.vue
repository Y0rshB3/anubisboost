<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store.js";

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const localError = ref("");

async function handleRegister() {
  localError.value = "";
  if (password.value !== confirmPassword.value) {
    localError.value = "Passwords do not match";
    return;
  }
  try {
    await auth.register(email.value, username.value, password.value);
    router.push("/client");
  } catch { /* error shown from store */ }
}
</script>

<template>
  <div class="register-page">
    <div class="bg-effects">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <div class="register-container">
      <div class="logo-section">
        <h1 class="logo-text">AnubisBoost</h1>
        <p class="logo-subtitle">Game Boosting Services</p>
      </div>

      <div class="register-card">
        <h2 class="card-title">Create Account</h2>
        <p class="card-subtitle">Join our boosting platform</p>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label>Username</label>
            <div class="input-wrapper">
              <i class="pi pi-user input-icon"></i>
              <input v-model="username" type="text" placeholder="Choose a username" required />
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <div class="input-wrapper">
              <i class="pi pi-envelope input-icon"></i>
              <input v-model="email" type="email" placeholder="you@example.com" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <i class="pi pi-lock input-icon"></i>
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Min. 8 characters" required />
              </div>
            </div>
            <div class="form-group">
              <label>Confirm</label>
              <div class="input-wrapper">
                <i class="pi pi-lock input-icon"></i>
                <input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" placeholder="Repeat password" required />
              </div>
            </div>
          </div>

          <label class="show-pass">
            <input type="checkbox" v-model="showPassword" />
            <span>Show passwords</span>
          </label>

          <div v-if="auth.error || localError" class="error-msg">
            <i class="pi pi-exclamation-circle"></i>
            {{ localError || auth.error }}
          </div>

          <button type="submit" class="btn-register" :disabled="auth.isLoading">
            <i v-if="auth.isLoading" class="pi pi-spin pi-spinner"></i>
            <span v-else>Create Account</span>
          </button>
        </form>

        <p class="login-link">
          Already have an account?
          <router-link to="/login">Sign In</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

.bg-effects { position: absolute; inset: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 8s ease-in-out infinite; }
.orb-1 { width: 350px; height: 350px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); top: -10%; left: -5%; }
.orb-2 { width: 250px; height: 250px; background: radial-gradient(circle, #3b82f6 0%, transparent 70%); bottom: -5%; right: -5%; animation-delay: 4s; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }

.register-container { position: relative; z-index: 1; width: 100%; max-width: 480px; }

.logo-section { text-align: center; margin-bottom: 2rem; }
.logo-text { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.logo-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }

.register-card {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px -20px rgba(124, 58, 237, 0.15);
}

.card-title { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.card-subtitle { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0 1.5rem; }
.register-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 0.875rem; color: #475569; font-size: 0.9rem; pointer-events: none; }
.input-wrapper input[type="text"],
.input-wrapper input[type="email"],
.input-wrapper input[type="password"] {
  width: 100%; padding: 0.75rem 0.875rem 0.75rem 2.5rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.75rem; color: #f1f5f9; font-size: 0.9rem; outline: none; transition: all 0.2s;
}
.input-wrapper input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
.input-wrapper input::placeholder { color: #475569; }

.show-pass { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.8rem; cursor: pointer; }
.show-pass input { accent-color: #7c3aed; }

.error-msg { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 0.75rem; color: #fca5a5; font-size: 0.85rem; }

.btn-register {
  width: 100%; padding: 0.8rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: 0.75rem;
  color: white; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
}
.btn-register:hover:not(:disabled) { background: linear-gradient(135deg, #6d28d9, #5b21b6); transform: translateY(-1px); box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4); }
.btn-register:disabled { opacity: 0.7; cursor: wait; }

.login-link { text-align: center; margin-top: 1.5rem; color: #64748b; font-size: 0.875rem; }
.login-link a { color: #a78bfa; text-decoration: none; font-weight: 600; }
.login-link a:hover { color: #c4b5fd; }

@media (max-width: 480px) {
  .register-card { padding: 1.5rem; }
  .form-row { grid-template-columns: 1fr; }
  .logo-text { font-size: 1.75rem; }
}
</style>
