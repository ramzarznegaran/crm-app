import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { D1Database } from "../db/types";

interface Env {
  DB: D1Database;
}

export const createContext = async (opts: FetchCreateContextFnOptions & { env?: Env }) => {
  const env = (opts as any).env as Env;
  
  return {
    req: opts.req,
    db: env?.DB,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
