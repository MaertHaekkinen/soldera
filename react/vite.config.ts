import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import eslintPlugin from "@nabla/vite-plugin-eslint";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      "^/(api|static|favicon\\.[a-z]+|admin|servicestatus)(/|\\?|$)":
        "http://127.0.0.1:8001",
    },
  },
  build: {
    outDir: "build",
    sourcemap: true,
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
  },
  plugins: [react(), tsconfigPaths(), { ...eslintPlugin(), apply: "serve" }],
  clearScreen: false,
  root: "react/",
});
