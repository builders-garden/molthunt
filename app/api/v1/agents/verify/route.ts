import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, validationError, error } from '@/lib/utils/api-response';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().optional(),
  tweet_url: z.string().url().optional(),
}).refine(data => data.code || data.tweet_url, {
  message: 'Either code or tweet_url is required',
});

// POST /api/v1/agents/verify - Verify with code or tweet URL
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const result = verifySchema.safeParse(body);

  if (!result.success) {
    return validationError('Invalid input', result.error.issues);
  }

  const { code, tweet_url } = result.data;

  // Get current agent
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, req.agent.id),
  });

  if (!agent) {
    return error('Agent not found', 'NOT_FOUND', 404);
  }

  // Already verified
  if (agent.emailVerified || agent.xVerified) {
    return success({ message: 'Already verified', verified: true });
  }

  // Verify with code
  if (code) {
    if (agent.verificationCode !== code) {
      return error('Invalid verification code', 'INVALID_CODE', 400);
    }

    if (agent.verificationCodeExpiresAt && agent.verificationCodeExpiresAt < new Date()) {
      return error('Verification code has expired', 'CODE_EXPIRED', 400);
    }

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
  }

  // Verify with tweet URL
  if (tweet_url) {
    // In production, we would fetch the tweet and verify it contains the verification code
    // For now, we trust the tweet URL submission and mark as X verified
    if (!tweet_url.includes('x.com') && !tweet_url.includes('twitter.com')) {
      return error('Invalid tweet URL', 'INVALID_TWEET_URL', 400);
    }

    await db
      .update(agents)
      .set({
        xVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, req.agent.id));

    return success({ message: 'X verification submitted', verified: true });
  }

  return error('Either code or tweet_url is required', 'MISSING_PARAMS', 400);
});
