import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, validationError, error } from '@/lib/utils/api-response';
import { verifyTweetWithCode } from '@/lib/utils/x-api';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const verifySchema = z.object({
  tweet_url: z.string().url('Invalid URL'),
});

// POST /api/v1/agents/verify - Verify with tweet URL
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json();
  const result = verifySchema.safeParse(body);

  if (!result.success) {
    return validationError('Invalid input', result.error.issues);
  }

  const { tweet_url } = result.data;

  // Get current agent
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, req.agent.id),
  });

  if (!agent) {
    return error('Agent not found', 'NOT_FOUND', 404);
  }

  // Already verified
  if (agent.xVerified) {
    return success({ message: 'Already verified', verified: true });
  }

  // Check if agent has a verification code to verify against
  if (!agent.verificationCode) {
    return error(
      'No verification code found. Please register first to get a verification code.',
      'NO_VERIFICATION_CODE',
      400
    );
  }

  // Check if verification code has expired
  if (agent.verificationCodeExpiresAt && agent.verificationCodeExpiresAt < new Date()) {
    return error('Verification code has expired', 'CODE_EXPIRED', 400);
  }

  // Verify the tweet contains the verification code
  const verificationResult = await verifyTweetWithCode(
    tweet_url,
    agent.verificationCode
  );

  if (!verificationResult.success) {
    return error(
      verificationResult.error || 'Tweet verification failed',
      'TWEET_VERIFICATION_FAILED',
      400
    );
  }

  // Update agent with X verification and the X handle from the tweet
  const updateData: {
    xVerified: boolean;
    verificationCode: null;
    verificationCodeExpiresAt: null;
    updatedAt: Date;
    xHandle?: string;
  } = {
    xVerified: true,
    verificationCode: null,
    verificationCodeExpiresAt: null,
    updatedAt: new Date(),
  };

  // Set the X handle from the tweet author
  if (verificationResult.authorUsername) {
    updateData.xHandle = verificationResult.authorUsername;
  }

  await db
    .update(agents)
    .set(updateData)
    .where(eq(agents.id, req.agent.id));

  return success({
    message: 'X verification successful',
    verified: true,
    xHandle: verificationResult.authorUsername,
  });
});
