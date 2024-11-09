import { defineConfig } from "@solidjs/start/config";
import { client, router, socketPlugins } from "./socket";

export default defineConfig({
  ssr: false,
  server: { experimental: { websocket: true } },
  vite: { plugins: socketPlugins() },
}).addRouter(router);
