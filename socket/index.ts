import { normalize } from "vinxi/lib/path";
export { client } from "./plugin/client";
import { server } from "./plugin/server";
import { fileURLToPath } from "url";
import { importsPlugin } from "./imports";
import { Plugin } from "vite";

export const router = {
  name: "socket-fns",
  type: "http",
  base: "/_ws",
  handler: "./socket/plugin/server-handler.ts",
  target: "server",
  plugins: () => socketPlugins(),
};

const printPlugin: () => Plugin = () => {
  return {
    name: "dev-print",
    enforce: "pre",
    transform(code, id, options) {
      if (
        id.includes("/socket") ||
        id.includes("/test") ||
        id.includes("serverSignal$") ||
        id.includes("/index.ts")
      ) {
        console.log(id, code);
      }
    },
  };
};

export const socketPlugins = () => [
  importsPlugin({ log: false }),
  server({
    runtime: normalize(
      fileURLToPath(
        new URL("./socket/plugin/server-runtime.js", import.meta.url)
      )
    ),
  }),
  // printPlugin(),
];
