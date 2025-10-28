import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';
import { generateId, getCurrentTimestamp, hashPassword, findUserByEmail } from '../../../db/utils';

export const createUserProcedure = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['owner', 'user']).default('user'),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db, user } = ctx;

    if (user.role !== 'owner') {
      throw new Error('Unauthorized: Only owners can create users');
    }

    const existingUser = await findUserByEmail(db, input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const userId = generateId('user');
    const passwordHash = await hashPassword(input.password);
    const timestamp = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO users (id, org_id, name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      user.org_id,
      input.name,
      input.email,
      passwordHash,
      input.role,
      timestamp
    );

    await stmt.run();

    return {
      id: userId,
      name: input.name,
      email: input.email,
      role: input.role,
      orgId: user.org_id,
      created_at: timestamp,
    };
  });
