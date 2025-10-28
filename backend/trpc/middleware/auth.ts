import { TRPCError } from '@trpc/server';
import { publicProcedure } from '../create-context';
import { User } from '../../db/types';

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No authorization token provided',
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
    }

    const stmt = ctx.db.prepare('SELECT * FROM users WHERE id = ?').bind(userId);
    const user = await stmt.first<User>();

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  } catch {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
});
