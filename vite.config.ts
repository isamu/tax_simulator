import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [vue()],
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
