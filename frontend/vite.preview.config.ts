import { defineConfig } from "vite";

// Local preview: the real panel driven by a fake `hass` with a simulated FP300.
export default defineConfig({
  root: "preview",
  define: { __BLIP_VERSION__: JSON.stringify("0.0.0-preview") },
  build: { outDir: "../dist-preview", emptyOutDir: true },
});
