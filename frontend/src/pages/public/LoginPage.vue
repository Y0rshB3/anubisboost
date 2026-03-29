<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store.js";
import { useI18n } from "vue-i18n";
import { setLocale } from "@/i18n/index.js";

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
// 2FA
const show2FA = ref(false);
const tfaUserId = ref(null);
const tfaDestination = ref("");
const tfaCode = ref("");

async function handleLogin() {
  try {
    const result = await auth.login(email.value, password.value);
    if (result?.requires2FA) {
      show2FA.value = true;
      tfaUserId.value = result.userId;
      tfaDestination.value = result.destination || "";
      return;
    }
    redirectByRole(result?.role);
  } catch {}
}

async function handle2FA() {
  try {
    const user = await auth.verify2FA(tfaUserId.value, tfaCode.value);
    redirectByRole(user?.role);
  } catch {}
}

function redirectByRole(role) {
  if (role === "admin") router.push("/admin");
  else if (role === "collaborator") router.push("/collaborator");
  else router.push("/client");
}

function toggleLang() {
  setLocale(locale.value === "es" ? "en" : "es");
}
</script>

<template>
  <div class="login-page">
    <div class="bg-effects"><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div></div>

    <!-- Language toggle -->
    <button class="lang-toggle" @click="toggleLang">{{ locale === 'es' ? '🇺🇸 EN' : '🇪🇸 ES' }}</button>

    <div class="login-container">
      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 40 40" fill="none"><path d="M20 2L37 11V29L20 38L3 29V11L20 2Z" stroke="url(#g)" stroke-width="2" fill="none"/><path d="M20 8L31 14V26L20 32L9 26V14L20 8Z" fill="url(#g)" opacity="0.3"/><path d="M20 14L25 17V23L20 26L15 23V17L20 14Z" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="40" y2="40"><stop stop-color="#a78bfa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs></svg>
        </div>
        <h1 class="logo-text">AnubisBoost</h1>
        <p class="logo-subtitle">Game Boosting Services</p>
      </div>

      <div class="login-card">
        <!-- 2FA Step -->
        <template v-if="show2FA">
          <div style="text-align: center; margin-bottom: 1.5rem">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(124,58,237,0.15);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.5rem;color:#a78bfa">
              <i class="pi pi-shield"></i>
            </div>
            <h2 class="card-title">{{ t('security.enter_2fa') }}</h2>
            <p class="card-subtitle">{{ t('security.enter_2fa_desc') }} {{ tfaDestination }}</p>
          </div>
          <form @submit.prevent="handle2FA" class="login-form">
            <div class="form-group">
              <div class="input-wrapper">
                <i class="pi pi-key input-icon"></i>
                <input v-model="tfaCode" type="text" maxlength="6" :placeholder="t('security.code_placeholder')" required style="text-align:center;letter-spacing:0.5em;font-size:1.2rem" />
              </div>
            </div>
            <div v-if="auth.error" class="error-msg"><i class="pi pi-exclamation-circle"></i> {{ auth.error }}</div>
            <button type="submit" class="btn-login" :disabled="auth.isLoading || tfaCode.length < 6">
              <i v-if="auth.isLoading" class="pi pi-spin pi-spinner"></i>
              <span v-else>{{ t('security.verify') }}</span>
            </button>
          </form>
          <p class="register-link" style="margin-top:1rem">
            <a href="#" @click.prevent="show2FA = false; auth.error = null">{{ t('common.back') }}</a>
          </p>
        </template>

        <!-- Normal login -->
        <template v-else>
        <h2 class="card-title">{{ t('auth.welcome_back') }}</h2>
        <p class="card-subtitle">{{ t('auth.sign_in_subtitle') }}</p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>{{ t('auth.email') }}</label>
            <div class="input-wrapper">
              <i class="pi pi-envelope input-icon"></i>
              <input v-model="email" type="email" placeholder="you@example.com" required />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('auth.password') }}</label>
            <div class="input-wrapper">
              <i class="pi pi-lock input-icon"></i>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" required />
              <button type="button" class="toggle-pass" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
          </div>
          <div v-if="auth.error" class="error-msg"><i class="pi pi-exclamation-circle"></i> {{ auth.error }}</div>
          <button type="submit" class="btn-login" :disabled="auth.isLoading">
            <i v-if="auth.isLoading" class="pi pi-spin pi-spinner"></i>
            <span v-else>{{ t('auth.sign_in') }}</span>
          </button>
        </form>

        <div class="divider"><span>or</span></div>
        <button class="btn-google" disabled>
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <span>{{ t('auth.continue_google') }}</span>
        </button>

        <p class="register-link">{{ t('auth.no_account') }} <router-link to="/register">{{ t('auth.register_link') }}</router-link></p>
        </template>
      </div>
      <p class="footer-text">{{ t('auth.footer') }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a1a; position: relative; overflow: hidden; padding: 1rem; }
.bg-effects { position: absolute; inset: 0; pointer-events: none; }
.orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 8s ease-in-out infinite; }
.orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, #7c3aed 0%, transparent 70%); top: -10%; right: -5%; }
.orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, #3b82f6 0%, transparent 70%); bottom: -5%; left: -5%; animation-delay: 3s; }
.orb-3 { width: 200px; height: 200px; background: radial-gradient(circle, #8b5cf6 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 5s; }
@keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }

.lang-toggle { position: absolute; top: 1.5rem; right: 1.5rem; z-index: 10; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 0.5rem; padding: 0.4rem 0.75rem; color: #94a3b8; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
.lang-toggle:hover { background: rgba(30, 41, 59, 0.8); color: #f1f5f9; }

.login-container { position: relative; z-index: 1; width: 100%; max-width: 420px; }
.logo-section { text-align: center; margin-bottom: 2rem; }
.logo-icon { width: 56px; height: 56px; margin: 0 auto 0.75rem; }
.logo-icon svg { width: 100%; height: 100%; }
.logo-text { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #7c3aed, #6d28d9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.logo-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
.login-card { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px -20px rgba(124, 58, 237, 0.15); }
.card-title { font-size: 1.5rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.card-subtitle { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0 1.5rem; }
.login-form { display: flex; flex-direction: column; gap: 1.25rem; }
.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 0.875rem; color: #475569; font-size: 0.9rem; pointer-events: none; }
.input-wrapper input { width: 100%; padding: 0.75rem 0.875rem 0.75rem 2.5rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.75rem; color: #f1f5f9; font-size: 0.9rem; outline: none; transition: all 0.2s; }
.input-wrapper input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); background: rgba(30, 41, 59, 0.8); }
.input-wrapper input::placeholder { color: #475569; }
.toggle-pass { position: absolute; right: 0.75rem; background: none; border: none; color: #475569; cursor: pointer; padding: 0.25rem; }
.toggle-pass:hover { color: #94a3b8; }
.error-msg { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 0.75rem; color: #fca5a5; font-size: 0.85rem; }
.btn-login { width: 100%; padding: 0.8rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: 0.75rem; color: white; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.5rem; }
.btn-login:hover:not(:disabled) { background: linear-gradient(135deg, #6d28d9, #5b21b6); transform: translateY(-1px); box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4); }
.btn-login:disabled { opacity: 0.7; cursor: wait; }
.divider { display: flex; align-items: center; margin: 1.5rem 0; gap: 1rem; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(71, 85, 105, 0.3); }
.divider span { color: #475569; font-size: 0.8rem; text-transform: uppercase; }
.btn-google { width: 100%; padding: 0.75rem; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(71, 85, 105, 0.3); border-radius: 0.75rem; color: #94a3b8; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: all 0.2s; }
.btn-google:disabled { opacity: 0.5; cursor: not-allowed; }
.register-link { text-align: center; margin-top: 1.5rem; color: #64748b; font-size: 0.875rem; }
.register-link a { color: #a78bfa; text-decoration: none; font-weight: 600; }
.register-link a:hover { color: #c4b5fd; }
.footer-text { text-align: center; color: #334155; font-size: 0.75rem; margin-top: 2rem; letter-spacing: 0.05em; }
@media (max-width: 480px) { .login-card { padding: 1.5rem; } .logo-text { font-size: 1.75rem; } }
</style>
