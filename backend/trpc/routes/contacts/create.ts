import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';
import { generateId, getCurrentTimestamp, findContactByPhone } from '../../../db/utils';

export const createContactProcedure = protectedProcedure
  .input(
    z.object({
      orgId: z.string(),
      name: z.string().min(1),
      phoneNumber: z.string().min(1),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db, user } = ctx;

    if (user.org_id !== input.orgId) {
      throw new Error('Unauthorized: Cannot create contact in different organization');
    }

    const existingContact = await findContactByPhone(db, input.orgId, input.phoneNumber);
    if (existingContact) {
      throw new Error('Contact with this phone number already exists');
    }

    const contactId = generateId('contact');
    const timestamp = getCurrentTimestamp();

    const stmt = db.prepare(`
      INSERT INTO contacts (id, org_id, name, phone_number, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      contactId,
      input.orgId,
      input.name,
      input.phoneNumber,
      user.id,
      timestamp,
      timestamp
    );

    await stmt.run();

    return {
      id: contactId,
      org_id: input.orgId,
      name: input.name,
      phone_number: input.phoneNumber,
      created_by_user_id: user.id,
      created_by_user_name: user.name,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
