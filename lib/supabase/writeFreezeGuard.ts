import { isMutatingSupabaseRpc, isWriteFreezeEnabled, WriteFrozenError } from "@/lib/platform/writeFreeze";

const MUTATING_QUERY_METHODS = new Set(["insert", "update", "upsert", "delete"]);

type QueryBuilder = Record<string | symbol, unknown>;

function guardQueryBuilder<T extends QueryBuilder>(builder: T): T {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof prop === "string" && MUTATING_QUERY_METHODS.has(prop) && typeof value === "function") {
        return (...args: unknown[]) => {
          if (isWriteFreezeEnabled()) {
            throw new WriteFrozenError();
          }

          return (value as (...inner: unknown[]) => unknown).apply(target, args);
        };
      }

      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const result = (value as (...inner: unknown[]) => unknown).apply(target, args);
          if (result && typeof result === "object") {
            return guardQueryBuilder(result as QueryBuilder);
          }
          return result;
        };
      }

      return value;
    },
  });
}

export function applyWriteFreezeGuard<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === "from" && typeof value === "function") {
        return (...args: unknown[]) => {
          const builder = (value as (...inner: unknown[]) => unknown).apply(target, args);
          if (builder && typeof builder === "object") {
            return guardQueryBuilder(builder as QueryBuilder);
          }
          return builder;
        };
      }

      if (prop === "rpc" && typeof value === "function") {
        return (fn: string, ...rest: unknown[]) => {
          if (isWriteFreezeEnabled() && isMutatingSupabaseRpc(fn)) {
            throw new WriteFrozenError();
          }

          return (value as (name: string, ...inner: unknown[]) => unknown).apply(target, [fn, ...rest]);
        };
      }

      if (typeof value === "function") {
        return value.bind(target);
      }

      return value;
    },
  });
}
