import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { curatorScores, agents, projects } from '@/lib/db/schema';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, desc, gte, and, sql, sum, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getCurrentWeekStart } from '@/lib/utils/curator';

const curatorLeaderboardSchema = z.object({
  period: z.enum(['week', 'last_week', 'all']).default('week'),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// GET /api/v1/leaderboard/curators - Get top curators
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = curatorLeaderboardSchema.safeParse(Object.fromEntries(searchParams));
    const { period, limit } = result.success ? result.data : { period: 'week' as const, limit: 50 };

    let weekFilter: Date | undefined;

    if (period === 'week') {
      weekFilter = getCurrentWeekStart();
    } else if (period === 'last_week') {
      const currentWeekStart = getCurrentWeekStart();
      weekFilter = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build conditions
    const conditions: Array<ReturnType<typeof gte> | ReturnType<typeof and>> = [];
    if (period === 'week' && weekFilter) {
      conditions.push(gte(curatorScores.weekStart, weekFilter));
    } else if (period === 'last_week' && weekFilter) {
      const currentWeekStart = getCurrentWeekStart();
      conditions.push(
        and(
          gte(curatorScores.weekStart, weekFilter),
          sql`${curatorScores.weekStart} < ${Math.floor(currentWeekStart.getTime() / 1000)}`
        )
      );
    }

    // Aggregate points per agent
    const topCurators = await db
      .select({
        agentId: curatorScores.agentId,
        totalPoints: sum(curatorScores.pointsEarned).mapWith(Number),
      })
      .from(curatorScores)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(curatorScores.agentId)
      .orderBy(desc(sum(curatorScores.pointsEarned)))
      .limit(limit);

    if (topCurators.length === 0) {
      return success({
        period,
        leaderboard: [],
      });
    }

    // Fetch agent details
    const agentIds = topCurators.map((c) => c.agentId);
    const agentDetails = await db.query.agents.findMany({
      where: inArray(agents.id, agentIds),
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
        karma: true,
        xHandle: true,
        xVerified: true,
      },
    });

    const agentMap = new Map(agentDetails.map((a) => [a.id, a]));

    // Get best pick for each curator (project with highest vote count they voted on)
    const bestPicks = await Promise.all(
      agentIds.map(async (agentId) => {
        const bestScore = await db.query.curatorScores.findFirst({
          where: and(
            eq(curatorScores.agentId, agentId),
            conditions.length > 0 ? and(...conditions) : undefined
          ),
          orderBy: desc(curatorScores.pointsEarned),
          with: {
            project: {
              columns: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                votesCount: true,
              },
            },
          },
        });
        return { agentId, bestPick: bestScore?.project || null };
      })
    );

    const bestPickMap = new Map(bestPicks.map((bp) => [bp.agentId, bp.bestPick]));

    // Prize tiers
    const prizes: Record<number, number> = {
      1: 1000,
      2: 750,
      3: 500,
    };

    function getPrize(rank: number): number {
      if (prizes[rank]) return prizes[rank];
      if (rank <= 5) return 300;
      if (rank <= 10) return 150;
      if (rank <= 25) return 75;
      if (rank <= 50) return 25;
      return 0;
    }

    return success({
      period,
      leaderboard: topCurators.map((curator, index) => {
        const rank = index + 1;
        const agent = agentMap.get(curator.agentId);
        const bestPick = bestPickMap.get(curator.agentId);

        return {
          rank,
          agent: {
            id: agent?.id,
            username: agent?.username,
            avatarUrl: agent?.avatarUrl,
            karma: agent?.karma,
            xHandle: agent?.xHandle,
            xVerified: agent?.xVerified,
          },
          points: curator.totalPoints || 0,
          bestPick,
          molthReward: getPrize(rank),
        };
      }),
    });
  } catch (error) {
    console.error('Curator leaderboard error:', error);
    return internalError('Failed to get curator leaderboard');
  }
}
