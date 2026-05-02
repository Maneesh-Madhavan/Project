import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync } from "fs";


const renderSPAFallback = () => ({
  name: "render-spa-fallback",
  closeBundle() {
    const dist = resolve("dist");
    try {
      copyFileSync(resolve(dist, "index.html"), resolve(dist, "200.html"));
      console.log("✓ Created 200.html for Render SPA fallback");
    } catch (_) { }
  },
});

export default defineConfig({
  plugins: [react(), renderSPAFallback()],
  resolve: {
    extensions: [".js", ".jsx"],
  },
});
