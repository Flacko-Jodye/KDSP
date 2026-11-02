import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: process.env.PAGES_BASE_PATH || "/",
  plugins: [react()],
  json: { stringify: true },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { catalog: ["./src/generated/pio-catalog.json"] },
      },
    },
  },
});
