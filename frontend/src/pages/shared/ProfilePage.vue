<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/auth.store.js";
import api from "@/config/api.config.js";

const { t } = useI18n();
const auth = useAuthStore();
const profileForm = ref({ username: "" });
const passwordForm = ref({ currentPassword: "", newPassword: "", confirmPassword: "" });
const savingProfile = ref(false);
const savingPassword = ref(false);
const profileMsg = ref("");
const passwordMsg = ref("");
const profileError = ref("");
const passwordError = ref("");

// Security
const security = ref({ two_factor_enabled: false, two_factor_method: "email", phone: "", email: "" });
const selectedMethod = ref("email");
const phoneInput = ref("");
const savingPhone = ref(false);
const phoneMsg = ref("");
// Email change
const newEmail = ref("");
const emailCode = ref("");
const emailStep = ref("idle"); // idle | code_sent | done
const emailMsg = ref("");
const emailError = ref("");
const savingEmail = ref(false);
// 2FA toggle
const toggling2FA = ref(false);

onMounted(async () => {
  if (auth.user) {
    profileForm.value.username = auth.user.username || "";
  }
  await fetchSecurity();
});

async function fetchSecurity() {
  try {
    const { data } = await api.get("/security/status");
    security.value = data.data;
    selectedMethod.value = data.data.two_factor_method || "email";
    phoneInput.value = data.data.phone || "";
  } catch {}
}

async function updateProfile() {
  savingProfile.value = true; profileMsg.value = ""; profileError.value = "";
  try {
    await api.patch("/users/me/profile", profileForm.value);
    await auth.fetchProfile();
    profileMsg.value = t("profile.profile_updated");
  } catch (err) { profileError.value = err.response?.data?.message || "Error"; }
  finally { savingProfile.value = false; }
}

async function changePassword() {
  savingPassword.value = true; passwordMsg.value = ""; passwordError.value = "";
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = t("auth.passwords_no_match"); savingPassword.value = false; return;
  }
  try {
    await api.patch("/users/me/password", { currentPassword: passwordForm.value.currentPassword, newPassword: passwordForm.value.newPassword });
    passwordMsg.value = t("profile.password_updated");
    passwordForm.value = { currentPassword: "", newPassword: "", confirmPassword: "" };
  } catch (err) { passwordError.value = err.response?.data?.message || "Error"; }
  finally { savingPassword.value = false; }
}

async function savePhone() {
  savingPhone.value = true; phoneMsg.value = "";
  try {
    await api.patch("/security/phone", { phone: phoneInput.value });
    phoneMsg.value = t("security.phone_saved");
    await fetchSecurity();
  } catch {} finally { savingPhone.value = false; }
}

async function toggle2FA() {
  toggling2FA.value = true;
  try {
    if (security.value.two_factor_enabled) {
      await api.post("/security/2fa/disable");
    } else {
      await api.post("/security/2fa/enable", { method: selectedMethod.value });
    }
    await fetchSecurity();
  } catch {} finally { toggling2FA.value = false; }
}

async function requestEmailChange() {
  savingEmail.value = true; emailError.value = "";
  try {
    const { data } = await api.post("/security/email/request", { email: newEmail.value });
    emailStep.value = "code_sent";
    emailMsg.value = `${t("security.code_sent")} ${data.data.email}`;
  } catch (err) { emailError.value = err.response?.data?.message || "Error"; }
  finally { savingEmail.value = false; }
}

async function confirmEmailChange() {
  savingEmail.value = true; emailError.value = "";
  try {
    await api.post("/security/email/confirm", { code: emailCode.value });
    emailStep.value = "done";
    emailMsg.value = t("security.email_changed");
    await auth.fetchProfile();
    await fetchSecurity();
  } catch (err) { emailError.value = err.response?.data?.message || "Error"; }
  finally { savingEmail.value = false; }
}
</script>

<template>
  <div class="profile-page">
    <h1>{{ t('profile.title') }}</h1>

    <!-- User info -->
    <div class="card info-card">
      <div class="user-avatar-large">{{ auth.user?.username?.[0]?.toUpperCase() || '?' }}</div>
      <div class="user-details">
        <h2>{{ auth.user?.username }}</h2>
        <p class="text-muted">{{ auth.user?.email }}</p>
        <div class="meta-row">
          <span class="badge">{{ t('profile.role') }}: {{ auth.user?.role }}</span>
          <span v-if="security.two_factor_enabled" class="badge badge-green">2FA {{ t('security.enabled') }}</span>
          <span class="text-muted-sm">{{ t('profile.member_since') }} {{ new Date(auth.user?.created_at).toLocaleDateString() }}</span>
        </div>
      </div>
    </div>

    <div class="cards-grid">
      <!-- Profile -->
      <div class="card">
        <h3>{{ t('profile.account_settings') }}</h3>
        <form @submit.prevent="updateProfile" class="form-stack">
          <div class="form-group">
            <label>{{ t('auth.username') }}</label>
            <input v-model="profileForm.username" type="text" required />
          </div>
          <p v-if="profileMsg" class="msg-success">{{ profileMsg }}</p>
          <p v-if="profileError" class="msg-error">{{ profileError }}</p>
          <button type="submit" class="btn-primary" :disabled="savingProfile">
            <i v-if="savingProfile" class="pi pi-spin pi-spinner"></i>
            {{ t('profile.update_profile') }}
          </button>
        </form>
      </div>

      <!-- Password -->
      <div class="card">
        <h3>{{ t('profile.change_password') }}</h3>
        <form @submit.prevent="changePassword" class="form-stack">
          <div class="form-group">
            <label>{{ t('profile.current_password') }}</label>
            <input v-model="passwordForm.currentPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>{{ t('profile.new_password') }}</label>
            <input v-model="passwordForm.newPassword" type="password" minlength="8" required />
          </div>
          <div class="form-group">
            <label>{{ t('profile.confirm_new_password') }}</label>
            <input v-model="passwordForm.confirmPassword" type="password" required />
          </div>
          <p v-if="passwordMsg" class="msg-success">{{ passwordMsg }}</p>
          <p v-if="passwordError" class="msg-error">{{ passwordError }}</p>
          <button type="submit" class="btn-primary" :disabled="savingPassword">
            <i v-if="savingPassword" class="pi pi-spin pi-spinner"></i>
            {{ t('profile.change_password') }}
          </button>
        </form>
      </div>

      <!-- Change Email -->
      <div class="card">
        <h3>{{ t('security.change_email') }}</h3>
        <p class="text-muted-sm" style="margin-bottom:1rem">{{ t('security.current_email') }}: <strong>{{ security.email }}</strong></p>

        <div v-if="emailStep === 'done'" class="msg-success">{{ emailMsg }}</div>

        <form v-else-if="emailStep === 'code_sent'" @submit.prevent="confirmEmailChange" class="form-stack">
          <p class="msg-info">{{ emailMsg }}</p>
          <div class="form-group">
            <label>{{ t('security.verify_code') }}</label>
            <input v-model="emailCode" type="text" maxlength="6" :placeholder="t('security.code_placeholder')" required />
          </div>
          <p v-if="emailError" class="msg-error">{{ emailError }}</p>
          <button type="submit" class="btn-primary" :disabled="savingEmail">{{ t('security.verify') }}</button>
        </form>

        <form v-else @submit.prevent="requestEmailChange" class="form-stack">
          <div class="form-group">
            <label>{{ t('security.new_email') }}</label>
            <input v-model="newEmail" type="email" required />
          </div>
          <p v-if="emailError" class="msg-error">{{ emailError }}</p>
          <button type="submit" class="btn-primary" :disabled="savingEmail || !newEmail">
            <i v-if="savingEmail" class="pi pi-spin pi-spinner"></i>
            {{ t('security.send_code') }}
          </button>
        </form>
      </div>

      <!-- 2FA -->
      <div class="card">
        <h3>
          <i class="pi pi-shield" style="color: #a78bfa; margin-right: 0.4rem"></i>
          {{ t('security.two_factor') }}
        </h3>
        <p class="text-muted-sm" style="margin-bottom: 1rem">{{ t('security.two_factor_desc') }}</p>

        <!-- Status -->
        <div class="tfa-status" :class="{ active: security.two_factor_enabled }">
          <div>
            <span class="tfa-badge" :class="security.two_factor_enabled ? 'on' : 'off'">
              {{ security.two_factor_enabled ? t('security.enabled') : t('security.disabled') }}
            </span>
            <span v-if="security.two_factor_enabled" class="text-muted-sm" style="margin-left: 0.5rem">
              {{ security.two_factor_method === 'sms' ? t('security.method_sms') : t('security.method_email') }}
            </span>
          </div>
        </div>

        <!-- Method selector (when disabled) -->
        <div v-if="!security.two_factor_enabled" class="form-stack" style="margin-top: 1rem">
          <div class="form-group">
            <label>{{ t('security.method') }}</label>
            <select v-model="selectedMethod" class="form-select">
              <option value="email">{{ t('security.method_email') }}</option>
              <option value="sms">{{ t('security.method_sms') }}</option>
            </select>
          </div>

          <!-- Phone input for SMS -->
          <div v-if="selectedMethod === 'sms'" class="form-group">
            <label>{{ t('security.phone') }}</label>
            <div style="display: flex; gap: 0.5rem">
              <input v-model="phoneInput" type="tel" :placeholder="t('security.phone_placeholder')" style="flex: 1" />
              <button type="button" class="btn-secondary" :disabled="savingPhone" @click="savePhone">
                <i v-if="savingPhone" class="pi pi-spin pi-spinner"></i>
                <i v-else class="pi pi-check"></i>
              </button>
            </div>
            <p v-if="phoneMsg" class="msg-success" style="margin-top: 0.25rem">{{ phoneMsg }}</p>
          </div>
        </div>

        <button class="btn-primary" style="margin-top: 1rem"
                :class="{ 'btn-danger': security.two_factor_enabled }"
                :disabled="toggling2FA || (selectedMethod === 'sms' && !security.phone && !security.two_factor_enabled)"
                @click="toggle2FA">
          <i v-if="toggling2FA" class="pi pi-spin pi-spinner"></i>
          {{ security.two_factor_enabled ? t('security.disable') : t('security.enable') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page { max-width: 800px; color: #f1f5f9; }
.profile-page h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }

.card { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(71, 85, 105, 0.2); border-radius: 0.875rem; padding: 1.5rem; }
.info-card { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; }
.user-avatar-large { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: white; flex-shrink: 0; }
.user-details h2 { margin: 0; font-size: 1.25rem; }
.text-muted { color: #64748b; font-size: 0.875rem; margin: 0.25rem 0; }
.text-muted-sm { color: #475569; font-size: 0.75rem; }
.meta-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap; }
.badge { background: rgba(124, 58, 237, 0.15); color: #a78bfa; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
.badge-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

.cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.card h3 { font-size: 1rem; font-weight: 600; margin: 0 0 1.25rem; display: flex; align-items: center; }

.form-stack { display: flex; flex-direction: column; gap: 1rem; }
.form-group label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.form-group input, .form-select {
  width: 100%; padding: 0.65rem 0.75rem; background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem;
  color: #f1f5f9; font-size: 0.85rem; outline: none; transition: all 0.2s; box-sizing: border-box;
}
.form-group input:focus, .form-select:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }

.msg-success { color: #4ade80; font-size: 0.8rem; margin: 0; }
.msg-error { color: #f87171; font-size: 0.8rem; margin: 0; }
.msg-info { color: #60a5fa; font-size: 0.8rem; margin: 0; }

.btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; border-radius: 0.625rem; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; align-self: flex-start; }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px -4px rgba(124, 58, 237, 0.4); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background: linear-gradient(135deg, #dc2626, #b91c1c) !important; }
.btn-danger:hover:not(:disabled) { box-shadow: 0 8px 20px -4px rgba(239, 68, 68, 0.4) !important; }
.btn-secondary { padding: 0.65rem 0.75rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(71, 85, 105, 0.4); border-radius: 0.625rem; color: #94a3b8; cursor: pointer; }

.tfa-status { padding: 0.75rem 1rem; border-radius: 0.625rem; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(71, 85, 105, 0.2); }
.tfa-status.active { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.2); }
.tfa-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
.tfa-badge.on { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
.tfa-badge.off { background: rgba(71, 85, 105, 0.2); color: #64748b; }

@media (max-width: 640px) {
  .cards-grid { grid-template-columns: 1fr; }
  .info-card { flex-direction: column; text-align: center; }
  .meta-row { justify-content: center; }
}
</style>
