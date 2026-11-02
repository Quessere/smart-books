import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  build: {
    outDir: "dist/client",
    assetsInlineLimit: 0,
    rollupOptions: { output: { manualChunks: { charts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers', 'echarts-wordcloud'] } } },
  },
  optimizeDeps: {
    include: ["vue", "echarts/core"],
  },
  server: {
    watch: { usePolling: process.platform === 'win32', interval: 300 },
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.ts"],
    },
  },
  plugins: [vue()],
});
