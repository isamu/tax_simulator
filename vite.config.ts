import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rolldownOptions: {
      input: {
        main: fromRoot("./index.html"),
        furusato: fromRoot("./furusato/index.html"),
      },
    },
  },
  test: {
    include: ["test/**/test_*.ts"],
  },
});
