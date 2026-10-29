import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // browser calls /queue-api/...  ->  https://ashapuri.157ipl.com/api/...
      "/queue-api": {
        target: "https://ashapuri.157ipl.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/queue-api/, "/api"),
      },
    },
  },
});