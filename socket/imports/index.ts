/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Plugin } from "vite";
import { compilepImports, type ImportPluginOptions } from "./compiler";
import { repushPlugin, getFilter, getRoot } from "./utils";
import path from "path";
import fs from "fs";
export function importsPlugin(opts?: ImportPluginOptions): Plugin {
  const filter = getFilter(opts?.filter);
  let root = "";
  let count = 0;
  const plugin: Plugin = {
    enforce: "pre",
    name: "imports",
    async transform(code, id, vOpts) {
      const [actualId, _ext, isValid] = filter(id);
      if (!isValid) {
        return code;
      }
      if (actualId.endsWith(".ts") || actualId.endsWith(".tsx")) {
        const res = await compilepImports(code, id, count, root, opts);
        if (code.includes("createServerSignal") && res?.code && vOpts?.ssr) {
          count++;
        }
        return res;
      }
      return undefined;
    },
    configResolved(config) {
      root = getRoot(config);
      repushPlugin(config.plugins as Plugin[], plugin, [
        "vite-server-references",
        "solid",
        "vinxi:routes",
      ]);
    },
    resolveId(id) {
      if (id.startsWith("virtual:") && id.includes("serverSignal$")) {
        return `${path.join(
          root,
          "node_modules",
          ".vinxi",
          "socket",
          `${id.split("virtual:")[1]}.js`
        )}`;
      }
      return null;
    },
  };
  return plugin;
}
