import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: ["desiree-subordinal-exponentially.ngrok-free.dev"],

    hmr: {
      clientPort: 443,
    },
  },
});
