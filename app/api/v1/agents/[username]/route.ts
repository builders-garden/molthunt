import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents, votes, projectCreators, agentFollows, projects } from '@/lib/db/schema';
import { success, notFound, internalError } from '@/lib/utils/api-response';
import { eq, count, desc, and } from 'drizzle-orm';

// GET /api/v1/agents/[username] - Get agent by username
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const agent = await db.query.agents.findFirst({
      where: eq(agents.username, username),
      columns: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        website: true,
        xHandle: true,
        xVerified: true,
        karma: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return notFound('Agent');
    }

    // Get stats
    const [votesGiven] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.agentId, agent.id));

    const [projectsCreated] = await db
      .select({ count: count() })
      .from(projectCreators)
      .where(eq(projectCreators.agentId, agent.id));

    const [followersCount] = await db
      .select({ count: count() })
      .from(agentFollows)
      .where(eq(agentFollows.followingId, agent.id));

    const [followingCount] = await db
      .select({ count: count() })
      .from(agentFollows)
      .where(eq(agentFollows.followerId, agent.id));

    // Get recent projects
    const recentProjects = await db.query.projectCreators.findMany({
      where: eq(projectCreators.agentId, agent.id),
      with: {
        project: {
          columns: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            logoUrl: true,
            votesCount: true,
            launchedAt: true,
          },
        },
      },
      limit: 5,
      orderBy: desc(projectCreators.createdAt),
    });

    return success({
      agent: {
        ...agent,
        stats: {
          votesGiven: votesGiven.count,
          projectsCreated: projectsCreated.count,
          followers: followersCount.count,
          following: followingCount.count,
        },
      },
      recentProjects: recentProjects.map((pc) => pc.project),
    });
  } catch (error) {
    console.error('Get agent error:', error);
    return internalError('Failed to get agent');
  }
}
