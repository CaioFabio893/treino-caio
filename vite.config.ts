/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

export default defineConfig({
  base: "/treino-caio/",
  plugins: [
    react(),
    {
      name: "offline-assets",
      closeBundle() {
        const assets = readdirSync("dist/assets").map(
          (file) => `assets/${file}`,
        );
        writeFileSync("dist/offline-assets.json", JSON.stringify(assets));
        const version = createHash("sha256")
          .update(JSON.stringify(assets) + readFileSync("dist/sw.js", "utf8"))
          .digest("hex")
          .slice(0, 12);
        const sw = readFileSync("dist/sw.js", "utf8").replace(
          "shell-v1",
          `shell-${version}`,
        );
        writeFileSync("dist/sw.js", sw);
      },
    },
  ],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
