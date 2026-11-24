import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 8765, strictPort: true },
  preview: { port: 8765, strictPort: true },
});
