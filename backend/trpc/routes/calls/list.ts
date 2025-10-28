import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';

export const listCallsProcedure = protectedProcedure
  .input(
    z.object({
      orgId: z.string(),
      limit: z.number().optional().default(100),
      offset: z.number().optional().default(0),
    })
  )
  .query(async ({ ctx, input }) => {
    const { db, user } = ctx;

    if (user.org_id !== input.orgId) {
      throw new Error('Unauthorized: Cannot access calls from different organization');
    }

    const stmt = db.prepare(`
      SELECT 
        ca.*,
        c.name as contact_name,
        u.name as user_name
      FROM calls ca
      LEFT JOIN contacts c ON ca.contact_id = c.id
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.org_id = ?
      ORDER BY ca.start_time DESC
      LIMIT ? OFFSET ?
    `).bind(input.orgId, input.limit, input.offset);

    const result = await stmt.all();
    return result.results || [];
  });
