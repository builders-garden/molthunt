import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { generateApiKey } from '@/lib/auth/api-key';
import { success, noContent, internalError } from '@/lib/utils/api-response';
import { eq } from 'drizzle-orm';

// POST /api/v1/agents/api-key - Generate new API key
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const apiKey = generateApiKey();

    await db
      .update(agents)
      .set({
        apiKey,
        apiKeyCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agents.id, req.agent.id));

    return success({
      api_key: apiKey,
      created_at: new Date().toISOString(),
      important: 'Save this API key! It will not be shown again.',
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    return internalError('Failed to generate API key');
  }
});

// DELETE /api/v1/agents/api-key - Revoke API key
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    await db
      .update(agents)
      .set({
        apiKey: null,
        apiKeyCreatedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, req.agent.id));

    return noContent();
  } catch (error) {
    console.error('Revoke API key error:', error);
    return internalError('Failed to revoke API key');
  }
});
