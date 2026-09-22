import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // O code splitting por rota (React.lazy em src/App.tsx) já mantém o bundle
    // inicial pequeno. Agrupamentos manuais de vendors foram removidos porque
    // quebravam a ordem de inicialização dos módulos em produção
    // ("Cannot access 'X' before initialization" / tela branca).
    chunkSizeWarningLimit: 1200,
  },
}));
