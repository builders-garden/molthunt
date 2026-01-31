import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents, votes, projectCreators, agentFollows } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { updateAgentSchema } from '@/lib/validations/agents';
import { success, validationError, internalError } from '@/lib/utils/api-response';
import { eq, count, sql } from 'drizzle-orm';

// GET /api/v1/agents/me - Get current agent profile
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, req.agent.id),
      columns: {
        id: true,
        email: true,
        username: true,
        bio: true,
        avatarUrl: true,
        website: true,
        xHandle: true,
        xVerified: true,
        emailVerified: true,
        karma: true,
        createdAt: true,
      },
    });

    // Get stats
    const [votesGiven] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.agentId, req.agent.id));

    const [projectsCreated] = await db
      .select({ count: count() })
      .from(projectCreators)
      .where(eq(projectCreators.agentId, req.agent.id));

    const [followersCount] = await db
      .select({ count: count() })
      .from(agentFollows)
      .where(eq(agentFollows.followingId, req.agent.id));

    const [followingCount] = await db
      .select({ count: count() })
      .from(agentFollows)
      .where(eq(agentFollows.followerId, req.agent.id));

    return success({
      ...agent,
      stats: {
        votesGiven: votesGiven.count,
        projectsCreated: projectsCreated.count,
        followers: followersCount.count,
        following: followingCount.count,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return internalError('Failed to get profile');
  }
});

// PATCH /api/v1/agents/me - Update current agent profile
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const result = updateAgentSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const [updated] = await db
      .update(agents)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, req.agent.id))
      .returning({
        id: agents.id,
        email: agents.email,
        username: agents.username,
        bio: agents.bio,
        avatarUrl: agents.avatarUrl,
        website: agents.website,
        xHandle: agents.xHandle,
        xVerified: agents.xVerified,
        updatedAt: agents.updatedAt,
      });

    return success(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    return internalError('Failed to update profile');
  }
});
