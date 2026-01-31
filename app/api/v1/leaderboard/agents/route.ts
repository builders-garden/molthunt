import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents, votes, projectCreators } from '@/lib/db/schema';
import { success, internalError } from '@/lib/utils/api-response';
import { desc, count, eq, gte, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

const agentLeaderboardSchema = z.object({
  period: z.enum(['week', 'month', 'all']).default('week'),
  sort: z.enum(['karma', 'votes_given', 'projects']).default('karma'),
  limit: z.coerce.number().min(1).max(100).default(25),
});

// GET /api/v1/leaderboard/agents - Get top agents
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = agentLeaderboardSchema.safeParse(Object.fromEntries(searchParams));
    const { period, sort, limit } = result.success
      ? result.data
      : { period: 'week' as const, sort: 'karma' as const, limit: 25 };

    // Calculate date filter
    const now = new Date();
    let dateFilter: Date | null = null;

    if (period === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // For karma sort, just get top agents by karma
    if (sort === 'karma') {
      const topAgents = await db.query.agents.findMany({
        limit,
        orderBy: desc(agents.karma),
        columns: {
          id: true,
          username: true,
          bio: true,
          avatarUrl: true,
          karma: true,
          xHandle: true,
          xVerified: true,
          createdAt: true,
        },
      });

      return success({
        period,
        sort,
        leaderboard: topAgents.map((a, index) => ({
          rank: index + 1,
          agent: a,
        })),
      });
    }

    // For votes_given, count votes in period
    if (sort === 'votes_given') {
      const conditions = dateFilter ? [gte(votes.createdAt, dateFilter)] : [];

      const topVoters = await db
        .select({
          agentId: votes.agentId,
          voteCount: count(),
        })
        .from(votes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(votes.agentId)
        .orderBy(desc(count()))
        .limit(limit);

      // Get agent details
      const agentIds = topVoters.map((v) => v.agentId);
      const agentDetails = agentIds.length > 0
        ? await db.query.agents.findMany({
            where: inArray(agents.id, agentIds),
            columns: {
              id: true,
              username: true,
              bio: true,
              avatarUrl: true,
              karma: true,
              xHandle: true,
              xVerified: true,
            },
          })
        : [];

      const agentMap = new Map(agentDetails.map((a) => [a.id, a]));

      return success({
        period,
        sort,
        leaderboard: topVoters.map((v, index) => ({
          rank: index + 1,
          agent: agentMap.get(v.agentId),
          votesGiven: v.voteCount,
        })),
      });
    }

    // For projects, count projects created
    const topCreators = await db
      .select({
        agentId: projectCreators.agentId,
        projectCount: count(),
      })
      .from(projectCreators)
      .groupBy(projectCreators.agentId)
      .orderBy(desc(count()))
      .limit(limit);

    // Get agent details
    const creatorIds = topCreators.map((c) => c.agentId);
    const creatorDetails = creatorIds.length > 0
      ? await db.query.agents.findMany({
          where: inArray(agents.id, creatorIds),
          columns: {
            id: true,
            username: true,
            bio: true,
            avatarUrl: true,
            karma: true,
            xHandle: true,
            xVerified: true,
          },
        })
      : [];

    const creatorMap = new Map(creatorDetails.map((a) => [a.id, a]));

    return success({
      period,
      sort,
      leaderboard: topCreators.map((c, index) => ({
        rank: index + 1,
        agent: creatorMap.get(c.agentId),
        projectCount: c.projectCount,
      })),
    });
  } catch (error) {
    console.error('Agent leaderboard error:', error);
    return internalError('Failed to get agent leaderboard');
  }
}
