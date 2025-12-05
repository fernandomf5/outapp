import { createRoot } from "react-dom/client";
import { LanguageProvider } from "./contexts/LanguageContext";
import App from "./App.tsx";
import "./index.css";
import "reactflow/dist/style.css";
import { preloadSiteSettings } from "./hooks/useSiteSettings";

// Preload site settings to prevent flash of old content
preloadSiteSettings();

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
