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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Separa bibliotecas pesadas em arquivos próprios, carregados apenas
        // pelas telas que realmente as utilizam.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("reactflow") || id.includes("@reactflow")) return "vendor-reactflow";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("html-to-image")) return "vendor-pdf";
          if (id.includes("@ffmpeg")) return "vendor-ffmpeg";
          if (id.includes("mammoth")) return "vendor-docx";
          if (id.includes("react-quill") || id.includes("quill")) return "vendor-editor";
          if (id.includes("emoji-mart")) return "vendor-emoji";
          if (id.includes("react-player")) return "vendor-player";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
          return undefined;
        },
      },
    },
  },
}));
