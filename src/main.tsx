import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App.tsx";
import "./index.css";
import "reactflow/dist/style.css";
import { preloadSiteSettings } from "./hooks/useSiteSettings";

// Preload site settings to prevent flash of old content
preloadSiteSettings();

// Keep the push-notification worker current on published domains. This worker
// does not cache pages; registering it also replaces legacy Workbox workers
// that could keep an outdated checkout bundle on mobile browsers.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const hostname = window.location.hostname;
  const isPreview = hostname.startsWith('id-preview--')
    || hostname.startsWith('preview--')
    || hostname === 'lovableproject.com'
    || hostname.endsWith('.lovableproject.com')
    || hostname === 'lovableproject-dev.com'
    || hostname.endsWith('.lovableproject-dev.com')
    || hostname === 'beta.lovable.dev'
    || hostname.endsWith('.beta.lovable.dev');

  if (!isPreview && window.top === window.self) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => registration.update())
        .catch((error) => console.error('Falha ao atualizar notificações:', error));
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
