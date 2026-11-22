/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

// Version shown in the panel footer = the integration's manifest version. No timestamp, so the
// build is reproducible and CI can check the committed bundle matches the source. (Browsers
// still load each new build: the integration adds a content hash to the panel's URL.)
const manifest = JSON.parse(readFileSync(new URL("../custom_components/blip/manifest.json", import.meta.url), "utf8"));

export default defineConfig({
  define: { __BLIP_VERSION__: JSON.stringify(manifest.version) },
  build: {
    outDir: "../custom_components/blip/frontend",
    emptyOutDir: true,
    target: "es2022",
    lib: {
      entry: "src/panel.ts",
      formats: ["es"],
      fileName: () => "blip-panel.js",
    },
  },
  test: { include: ["test/**/*.test.ts"] },
});
