import { createFilter, FilterPattern } from "@rollup/pluginutils";
import { Plugin } from "vite";
import * as babel from "@babel/core";
import path from "path";
import fs from "fs";

export const DEFAULT_INCLUDE = "{src,socket}/**/*.{jsx,tsx,ts,js,mjs,cjs}";
export const DEFAULT_EXCLUDE = "node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}";

export function getFileName(_filename: string): [string, string] {
  if (_filename.includes("?")) {
    // might be useful for the future
    const [actualId] = _filename.split("?");
    const ext = actualId.split(".")[1];
    return [actualId, ext];
  }
  const ext = _filename.split(".")[1];

  return [_filename, ext];
}

export const getFilter = (f?: {
  include?: FilterPattern;
  exclude?: FilterPattern;
}) => {
  const filter = createFilter(
    f?.include ?? DEFAULT_INCLUDE,
    f?.exclude ?? DEFAULT_EXCLUDE
  );
  return (id: string): [string, string, boolean] => {
    const [actualName, ext] = getFileName(id);
    return [actualName, ext, filter(actualName)];
  };
};

// From: https://github.com/bluwy/whyframe/blob/master/packages/jsx/src/index.js#L27-L37
export function repushPlugin(
  plugins: Plugin[],
  plugin: Plugin | string,
  pluginNames: string[]
): void {
  const namesSet = new Set(pluginNames);
  const name = typeof plugin === "string" ? plugin : plugin.name;
  const currentPlugin = plugins.find((e) => e.name === name)!;
  let baseIndex = -1;
  let targetIndex = -1;
  for (let i = 0, len = plugins.length; i < len; i += 1) {
    const current = plugins[i];
    if (namesSet.has(current.name) && baseIndex === -1) {
      baseIndex = i;
    }
    if (current.name === name) {
      targetIndex = i;
    }
  }
  if (baseIndex !== -1 && targetIndex !== -1 && baseIndex < targetIndex) {
    plugins.splice(targetIndex, 1);
    plugins.splice(baseIndex, 0, currentPlugin);
  }
}

export const importIfNotThere = (
  path:
    | babel.NodePath<babel.types.CallExpression>
    | babel.NodePath<babel.types.Program>,
  t: typeof babel.types,
  name: string,
  loc: string
) => {
  const p = (path.findParent((p) => p.isProgram())?.node ?? (path.node! as any))
    .body;
  const nameIsimported = p.some(
    (n: any) =>
      n.type === "ImportDeclaration" &&
      n.specifiers.some((s: any) => s.imported?.name === name)
  );

  if (!nameIsimported) {
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(name), t.identifier(name))],
      t.stringLiteral(loc)
    );
    p.unshift(importDeclaration);
  }
};

export const pushStmts = (
  stmts: babel.types.Statement[] | babel.types.Statement,
  path: babel.NodePath<babel.types.Program>,
  pushToTop = false
) => {
  stmts = Array.isArray(stmts) ? stmts : [stmts];

  if (pushToTop) {
    const lastImport = path.node.body.findIndex(
        (node) => node.type !== "ImportDeclaration"
      ),
      before = path.node.body.slice(0, lastImport),
      after = path.node.body.slice(lastImport);
    path.node.body = [...before, ...stmts, ...after];
  } else {
    path.node.body.push(...stmts);
  }
};

export const getRoot = (router: { root: string }) => {
  return router.root;
};

export const writeTempFile = async (
  code: string,
  root: string,
  name: string
) => {
  const tempDir = path.join(root, "node_modules", ".vinxi", "socket");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const tempFilePath = path.join(tempDir, `${name}.js`);
  console.log(`Wrote to ${tempFilePath}`, code);
  fs.writeFileSync(tempFilePath, code, "utf8");
};

export const capitalize = (name: string) => {
  return `${name.slice(0, 1).toUpperCase() + name.slice(1)}`;
};
