import { normalize } from "vinxi/lib/path";
export { client } from "./plugin/client";
import { server } from "./plugin/server";
import { fileURLToPath } from "url";
import { importsPlugin } from "./imports";
import { Plugin } from "vite";
import { client } from "./plugin/client";

export const router = {
  name: "socket-fns",
  type: "http",
  base: "/_ws",
  handler: "./socket/plugin/server-handler.ts",
  target: "server",
  plugins: () => socketPlugins(true),
};

export const socketPlugins = (isServer?: boolean) => [
  importsPlugin({ log: false }),
  ...server({
    runtime: normalize(
      fileURLToPath(
        new URL("./socket/plugin/server-runtime.js", import.meta.url)
      )
    ),
  }),
  ...(isServer ? [] : client()),
  // printPlugin(),
];

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
