import { protectedProcedure } from '../../middleware/auth';

export const listUsersProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { db, user } = ctx;

  const stmt = db.prepare(`
    SELECT id, name, email, role, created_at
    FROM users
    WHERE org_id = ?
    ORDER BY created_at DESC
  `).bind(user.org_id);

  const result = await stmt.all();
  return result.results || [];
});
