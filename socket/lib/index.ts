import type { Accessor, Setter } from "solid-js";
import { createSignal } from "solid-js";
import { createSocketMemo } from "./shared";

export const createServerSignal: $ServerSignal = new Proxy(
  <N, T>(name: N, defaultValue?: T) => {
    // throw new Error("Should Be Compiled Away");
  },
  {
    get(target, prop) {
      if (prop === "use") {
        return () => {
          return createServerSignal;
        };
      }

      return (target as any)[prop];
    },
  }
) as any;

type $Fn = (...args: any[]) => any;
type $InferPromise<Fn extends $Fn> = ReturnType<Awaited<Fn>>;

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

interface $ServerSignal<MW$ = unknown> {
  use<Fn extends $Fn>(fn: Fn): $ServerSignal<$InferPromise<$Fn>>;
  <N extends string, T>(name: N, defaultValue?: T): Prettify<
    Record<N, Accessor<T>> & Record<`set${Capitalize<N>}`, Setter<T>>
  >;
}
