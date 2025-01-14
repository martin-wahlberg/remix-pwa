import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { installGlobals } from "@remix-run/node";
import tsconfigPaths from "vite-tsconfig-paths";
import { remixPWA } from '@remix-pwa/dev';

installGlobals();

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      appDirectory: './src/app',
      // ssr: false,
    }),
    tsconfigPaths(),
    remixPWA({
      buildVariables: {
        'process.env.NODE_ENV': process.env.NODE_ENV ?? 'production',
        'process.env.API_URL': 'https://api.example.com',
        'miscellaneous': 'value',
      }
      // workerEntryPoint: './runtime.js'
    }),
  ],
  server: {
    port: 3_000,
  }
});