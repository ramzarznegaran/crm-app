import { z } from 'zod';
import { protectedProcedure } from '../../middleware/auth';
import { generateId, findContactByPhone } from '../../../db/utils';

export const syncCallsProcedure = protectedProcedure
  .input(
    z.object({
      orgId: z.string(),
      calls: z.array(
        z.object({
          phoneNumber: z.string(),
          direction: z.enum(['incoming', 'outgoing']),
          startTime: z.number(),
          duration: z.number(),
        })
      ),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { db, user } = ctx;

    if (user.org_id !== input.orgId) {
      throw new Error('Unauthorized: Cannot sync calls to different organization');
    }

    const results = [];
    const timestamp = Math.floor(Date.now() / 1000);

    for (const call of input.calls) {
      const existingStmt = db.prepare(`
        SELECT id FROM calls 
        WHERE org_id = ? AND phone_number = ? AND start_time = ? AND user_id = ?
      `).bind(input.orgId, call.phoneNumber, call.startTime, user.id);

      const existing = await existingStmt.first();

      if (!existing) {
        const contact = await findContactByPhone(db, input.orgId, call.phoneNumber);
        const contactId = contact ? (contact as any).id : null;

        const callId = generateId('call');

        const insertStmt = db.prepare(`
          INSERT INTO calls (id, org_id, contact_id, user_id, phone_number, direction, start_time, duration, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          callId,
          input.orgId,
          contactId,
          user.id,
          call.phoneNumber,
          call.direction,
          call.startTime,
          call.duration,
          timestamp
        );

        await insertStmt.run();

        results.push({
          id: callId,
          phone_number: call.phoneNumber,
          synced: true,
        });
      } else {
        results.push({
          id: (existing as any).id,
          phone_number: call.phoneNumber,
          synced: false,
          reason: 'already_exists',
        });
      }
    }

    return {
      synced: results.filter(r => r.synced).length,
      skipped: results.filter(r => !r.synced).length,
      results,
    };
  });
