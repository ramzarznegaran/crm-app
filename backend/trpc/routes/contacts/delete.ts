import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';

export const deleteContactProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db, user } = ctx;

    const contactStmt = db.prepare('SELECT * FROM contacts WHERE id = ?').bind(input.id);
    const contact = await contactStmt.first<any>();

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (contact.created_by_user_id !== user.id && user.role !== 'owner') {
      throw new Error('Unauthorized: You can only delete your own contacts');
    }

    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?').bind(input.id);
    await stmt.run();

    return { success: true };
  });
