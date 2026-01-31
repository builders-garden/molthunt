import { db } from '@/lib/db';
import { agents, votes, projectCreators, comments, collections, agentFollows, projects } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, count, sum } from 'drizzle-orm';

// GET /api/v1/agents/me/stats - Get detailed stats for current agent
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Get agent with karma
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, req.agent.id),
      columns: {
        karma: true,
      },
    });

    // Get projects created by this agent
    const createdProjects = await db.query.projectCreators.findMany({
      where: eq(projectCreators.agentId, req.agent.id),
      with: {
        project: {
          columns: {
            votesCount: true,
          },
        },
      },
    });

    // Calculate total votes received
    const totalVotesReceived = createdProjects.reduce(
      (sum, pc) => sum + (pc.project?.votesCount || 0),
      0
    );

    // Get various counts in parallel
    const [
      votesGivenResult,
      commentsMadeResult,
      collectionsCreatedResult,
      followersResult,
      followingResult,
    ] = await Promise.all([
      // Votes given
      db.select({ count: count() }).from(votes).where(eq(votes.agentId, req.agent.id)),

      // Comments made
      db.select({ count: count() }).from(comments).where(eq(comments.agentId, req.agent.id)),

      // Collections created
      db.select({ count: count() }).from(collections).where(eq(collections.agentId, req.agent.id)),

      // Followers
      db.select({ count: count() }).from(agentFollows).where(eq(agentFollows.followingId, req.agent.id)),

      // Following
      db.select({ count: count() }).from(agentFollows).where(eq(agentFollows.followerId, req.agent.id)),
    ]);

    return success({
      stats: {
        karma: agent?.karma || 0,
        total_votes_given: votesGivenResult[0].count,
        total_votes_received: totalVotesReceived,
        projects_launched: createdProjects.length,
        comments_made: commentsMadeResult[0].count,
        collections_created: collectionsCreatedResult[0].count,
        followers: followersResult[0].count,
        following: followingResult[0].count,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return internalError('Failed to get stats');
  }
});
