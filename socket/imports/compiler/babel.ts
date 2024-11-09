/* eslint-disable @typescript-eslint/no-explicit-any */
import * as babel from "@babel/core";
import { ImportPluginOptions } from ".";
import {
  capitalize,
  importIfNotThere,
  pushStmts,
  writeTempFile,
} from "../utils";

const specificImports = [
  "createMemo",
  "createRoot",
  "createSignal",
  "createEffect",
  "from",
  "observable",
  "untrack",
  "onCleanup",
];

const serverSolidLoc = "solid-js/dist/solid";

const packageLoc = "socket/lib";

export function createTransform$(
  count: number,
  root: string,
  opts?: ImportPluginOptions
) {
  return function transform$({
    types: t,
    template: temp,
  }: {
    types: typeof babel.types;
    template: typeof babel.template;
  }): babel.PluginObj {
    return {
      visitor: {
        async CallExpression(path) {
          if (opts?.importsOnly) return;
          const { callee } = path.node;
          if (t.isIdentifier(callee, { name: "createServerSignal" })) {
            const passedName = (path.node.arguments?.[0] as any).value;
            const defaultValue = path.node.arguments?.[1];

            const name = `serverSignal$${count}`;

            importIfNotThere(
              path,
              t,
              `use${capitalize(name)}`,
              `virtual:${name}`
            );
            path.replaceWith(
              t.callExpression(t.identifier(`use${capitalize(name)}`), [])
            );

            await writeTempFile(
              `'use socket';
import { createSignal } from "${serverSolidLoc}";
import { createSocketMemo } from "../../../socket/lib/shared";

export const use${capitalize(name)} = () => {
const [${name}, set${name}] = createSignal(${
                defaultValue && "value" in defaultValue
                  ? defaultValue.value
                  : ""
              });
 return {
 ${passedName}: createSocketMemo(${name}),
 set${capitalize(passedName)}: set${name},
 };
}`,
              root,
              name
            );
          }
        },
        ImportDeclaration(path) {
          if (path.node.source.value === "solid-js") {
            const specificSpecifiers = path.node.specifiers.filter(
              (specifier) =>
                t.isImportSpecifier(specifier) &&
                specificImports.includes((specifier.imported as any).name)
            );
            const otherSpecifiers = path.node.specifiers.filter(
              (specifier) =>
                t.isImportSpecifier(specifier) &&
                !specificImports.includes((specifier.imported as any).name)
            );
            if (specificSpecifiers.length > 0) {
              const newImportDeclaration = t.importDeclaration(
                specificSpecifiers,
                t.stringLiteral(serverSolidLoc)
              );
              path.insertAfter(newImportDeclaration);
              if (otherSpecifiers.length > 0) {
                path.node.specifiers = otherSpecifiers;
              } else {
                path.remove();
              }
            }
          }
        },
      },
    };
  };
}

export async function compilepImports(
  code: string,
  id: string,
  count: number,
  root: string,
  opts?: ImportPluginOptions
) {
  try {
    const plugins: babel.ParserOptions["plugins"] = ["typescript", "jsx"];
    const transform$ = createTransform$(count, root, opts);
    const transformed = await babel.transformAsync(code, {
      presets: [["@babel/preset-typescript"], ...(opts?.babel?.presets ?? [])],
      parserOpts: {
        plugins,
      },
      plugins: [[transform$], ...(opts?.babel?.plugins ?? [])],
      filename: id,
    });
    if (transformed) {
      if (opts?.log) {
        console.log(id, transformed.code);
      }
      return {
        code: transformed.code ?? "",
        map: transformed.map,
      };
    }
    return null;
  } catch (e) {
    console.error("err$$", e);
    return null;
  }
}
