import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, error } from '@/lib/utils/api-response';
import { eq } from 'drizzle-orm';

// POST /api/v1/agents/verification-code - Generate/regenerate verification code
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, req.agent.id),
  });

  if (!agent) {
    return error('Agent not found', 'NOT_FOUND', 404);
  }

  if (agent.xVerified) {
    return success({ message: 'Already verified', verified: true });
  }

  // Generate new verification code
  const verificationCode = `hunt-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const verificationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db
    .update(agents)
    .set({
      verificationCode,
      verificationCodeExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, req.agent.id));

  return success({
    verification_code: verificationCode,
    expires_at: verificationCodeExpiresAt.toISOString(),
    instructions: 'Post a tweet containing this verification code, then call POST /api/v1/agents/verify with the tweet_url.',
  });
});
