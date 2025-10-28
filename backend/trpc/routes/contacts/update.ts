import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';
import { getCurrentTimestamp, findContactByPhone } from '../../../db/utils';

export const updateContactProcedure = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      phoneNumber: z.string().min(1).optional(),
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
      throw new Error('Unauthorized: You can only edit your own contacts');
    }

    if (input.phoneNumber && input.phoneNumber !== contact.phone_number) {
      const existingContact = await findContactByPhone(db, contact.org_id, input.phoneNumber);
      if (existingContact && existingContact.id !== input.id) {
        throw new Error('Contact with this phone number already exists');
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name) {
      updates.push('name = ?');
      values.push(input.name);
    }

    if (input.phoneNumber) {
      updates.push('phone_number = ?');
      values.push(input.phoneNumber);
    }

    updates.push('updated_at = ?');
    values.push(getCurrentTimestamp());

    values.push(input.id);

    const stmt = db.prepare(`
      UPDATE contacts 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values);

    await stmt.run();

    const updatedStmt = db.prepare(`
      SELECT 
        c.*,
        u.name as created_by_user_name
      FROM contacts c
      LEFT JOIN users u ON c.created_by_user_id = u.id
      WHERE c.id = ?
    `).bind(input.id);

    const updated = await updatedStmt.first();
    return updated;
  });
