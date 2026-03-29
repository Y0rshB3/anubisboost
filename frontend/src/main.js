import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import "primeicons/primeicons.css";
import "@/assets/styles/main.css";
import App from "./App.vue";
import router from "./router/index.js";
import i18n from "./i18n/index.js";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(PrimeVue, {
  theme: { preset: Aura, options: { darkModeSelector: ".dark", cssLayer: false } },
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount("#app");
