import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { verifyEmailSchema } from '@/lib/validations/agents';
import { success, validationError, notFound, error } from '@/lib/utils/api-response';
import { eq, and, gt } from 'drizzle-orm';

// POST /api/v1/agents/verify - Verify email with code
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const result = verifyEmailSchema.safeParse(body);

  if (!result.success) {
    return validationError('Invalid input', result.error.issues);
  }

  const { code } = result.data;

  // Find agent with matching code that hasn't expired
  const agent = await db.query.agents.findFirst({
    where: and(
      eq(agents.id, req.agent.id),
      eq(agents.verificationCode, code),
      gt(agents.verificationCodeExpiresAt, new Date())
    ),
  });

  if (!agent) {
    return error('Invalid or expired verification code', 'INVALID_CODE', 400);
  }

  // Mark as verified
  await db
    .update(agents)
    .set({
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, req.agent.id));

  return success({ message: 'Email verified successfully', verified: true });
});
