import { z } from 'zod';
import { publicProcedure } from '../../create-context';
import { verifyPassword, findUserByEmail } from '../../../db/utils';
import { User, Organization } from '../../../db/types';

function createToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
  const signature = btoa(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const user = await findUserByEmail(ctx.db, input.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const userTyped = user as User;
    const isValid = await verifyPassword(input.password, userTyped.password_hash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const orgStmt = ctx.db.prepare('SELECT * FROM organizations WHERE id = ?').bind(userTyped.org_id);
    const organization = await orgStmt.first<Organization>();

    if (!organization) {
      throw new Error('Organization not found');
    }

    const token = createToken(userTyped.id);

    return {
      user: {
        id: userTyped.id,
        name: userTyped.name,
        email: userTyped.email,
        role: userTyped.role,
        orgId: userTyped.org_id,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      token,
    };
  });
