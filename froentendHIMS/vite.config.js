import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/queue-api": {
        target: "http://93.127.199.85:4090",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/queue-api/, "/api"),
      },
    },
  },
});