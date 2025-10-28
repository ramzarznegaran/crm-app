import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';
import { generateId, findContactByPhone } from '../../../db/utils';

export const createCallProcedure = protectedProcedure
  .input(
    z.object({
      orgId: z.string(),
      phoneNumber: z.string(),
      direction: z.enum(['incoming', 'outgoing']),
      startTime: z.number(),
      duration: z.number().default(0),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db, user } = ctx;

    if (user.org_id !== input.orgId) {
      throw new Error('Unauthorized: Cannot create call in different organization');
    }

    const contact = await findContactByPhone(db, input.orgId, input.phoneNumber);
    const contactId = contact ? (contact as any).id : null;

    const callId = generateId('call');
    const timestamp = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO calls (id, org_id, contact_id, user_id, phone_number, direction, start_time, duration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      callId,
      input.orgId,
      contactId,
      user.id,
      input.phoneNumber,
      input.direction,
      input.startTime,
      input.duration,
      timestamp
    );

    await stmt.run();

    return {
      id: callId,
      org_id: input.orgId,
      contact_id: contactId,
      user_id: user.id,
      phone_number: input.phoneNumber,
      direction: input.direction,
      start_time: input.startTime,
      duration: input.duration,
      created_at: timestamp,
    };
  });
