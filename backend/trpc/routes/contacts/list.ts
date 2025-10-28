import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';

export const listContactsProcedure = protectedProcedure
  .input(
    z.object({
      orgId: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { db, user } = ctx;

    if (user.org_id !== input.orgId) {
      throw new Error('Unauthorized: Cannot access contacts from different organization');
    }

    const stmt = db.prepare(`
      SELECT 
        c.*,
        u.name as created_by_user_name
      FROM contacts c
      LEFT JOIN users u ON c.created_by_user_id = u.id
      WHERE c.org_id = ?
      ORDER BY c.created_at DESC
    `).bind(input.orgId);

    const result = await stmt.all();
    return result.results || [];
  });
