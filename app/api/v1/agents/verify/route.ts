import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, validationError, error } from '@/lib/utils/api-response';
import { verifyTweetWithCode } from '@/lib/utils/x-api';
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

    // Update agent with X verification and optionally the X handle
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

    // If we got the author's username and agent doesn't have an X handle, set it
    if (verificationResult.authorUsername && !agent.xHandle) {
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
  }

  return error('Either code or tweet_url is required', 'MISSING_PARAMS', 400);
});
