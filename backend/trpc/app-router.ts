import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { loginProcedure } from "./routes/auth/login";
import { meProcedure } from "./routes/auth/me";
import { listContactsProcedure } from "./routes/contacts/list";
import { createContactProcedure } from "./routes/contacts/create";
import { updateContactProcedure } from "./routes/contacts/update";
import { deleteContactProcedure } from "./routes/contacts/delete";
import { listCallsProcedure } from "./routes/calls/list";
import { createCallProcedure } from "./routes/calls/create";
import { syncCallsProcedure } from "./routes/calls/sync";
import { createUserProcedure } from "./routes/users/create";
import { listUsersProcedure } from "./routes/users/list";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    login: loginProcedure,
    me: meProcedure,
  }),
  contacts: createTRPCRouter({
    list: listContactsProcedure,
    create: createContactProcedure,
    update: updateContactProcedure,
    delete: deleteContactProcedure,
  }),
  calls: createTRPCRouter({
    list: listCallsProcedure,
    create: createCallProcedure,
    sync: syncCallsProcedure,
  }),
  users: createTRPCRouter({
    create: createUserProcedure,
    list: listUsersProcedure,
  }),
});

export type AppRouter = typeof appRouter;
