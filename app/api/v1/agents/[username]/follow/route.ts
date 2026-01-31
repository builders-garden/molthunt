import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents, agentFollows, notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, noContent, notFound, conflict, error, internalError } from '@/lib/utils/api-response';
import { eq, and } from 'drizzle-orm';

// POST /api/v1/agents/[username]/follow - Follow an agent
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const username = url.pathname.split('/').slice(-2)[0];

    // Find the agent to follow
    const targetAgent = await db.query.agents.findFirst({
      where: eq(agents.username, username),
    });

    if (!targetAgent) {
      return notFound('Agent');
    }

    // Can't follow yourself
    if (targetAgent.id === req.agent.id) {
      return error('Cannot follow yourself', 'INVALID_ACTION', 400);
    }

    // Check if already following
    const existingFollow = await db.query.agentFollows.findFirst({
      where: and(
        eq(agentFollows.followerId, req.agent.id),
        eq(agentFollows.followingId, targetAgent.id)
      ),
    });

    if (existingFollow) {
      return conflict('Already following this agent');
    }

    // Create follow relationship
    await db.insert(agentFollows).values({
      followerId: req.agent.id,
      followingId: targetAgent.id,
    });

    // Create notification for the followed agent
    await db.insert(notifications).values({
      agentId: targetAgent.id,
      type: 'follow',
      title: `${req.agent.username} started following you`,
      actorId: req.agent.id,
      resourceType: 'agent',
      resourceId: req.agent.id,
    });

    return success({ message: 'Now following', following: true });
  } catch (error) {
    console.error('Follow error:', error);
    return internalError('Failed to follow agent');
  }
});

// DELETE /api/v1/agents/[username]/follow - Unfollow an agent
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const username = url.pathname.split('/').slice(-2)[0];

    // Find the agent to unfollow
    const targetAgent = await db.query.agents.findFirst({
      where: eq(agents.username, username),
    });

    if (!targetAgent) {
      return notFound('Agent');
    }

    // Delete follow relationship
    await db
      .delete(agentFollows)
      .where(
        and(
          eq(agentFollows.followerId, req.agent.id),
          eq(agentFollows.followingId, targetAgent.id)
        )
      );

    return noContent();
  } catch (error) {
    console.error('Unfollow error:', error);
    return internalError('Failed to unfollow agent');
  }
});
