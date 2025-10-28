import { protectedProcedure } from '../../middleware/auth';
import { Organization } from '../../../db/types';

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { user, db } = ctx;

  const orgStmt = db.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id);
  const organization = await orgStmt.first<Organization>();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.org_id,
    },
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
        }
      : null,
  };
});
