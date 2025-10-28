import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { D1Database } from "./db/types";

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (opts, c) => {
      return createContext({ ...opts, env: c.env });
    },
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "tRPC API is running" });
});

app.onError((err, c) => {
  console.error('Hono error:', err);
  return c.json({ error: err.message }, 500);
});

export default app;
