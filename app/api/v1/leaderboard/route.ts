import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, votes } from '@/lib/db/schema';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, gte, desc, and, count, sql } from 'drizzle-orm';
import { z } from 'zod';

const leaderboardSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('today'),
  limit: z.coerce.number().min(1).max(100).default(25),
});

// GET /api/v1/leaderboard - Get top projects by period
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = leaderboardSchema.safeParse(Object.fromEntries(searchParams));
    const { period, limit } = result.success ? result.data : { period: 'today' as const, limit: 25 };

    // Calculate date filter
    const now = new Date();
    let dateFilter: Date | null = null;

    if (period === 'today') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let topProjects;

    if (period === 'all') {
      // For all time, use the cached votesCount
      topProjects = await db.query.projects.findMany({
        where: eq(projects.status, 'launched'),
        limit,
        orderBy: desc(projects.votesCount),
        with: {
          creators: {
            with: {
              agent: {
                columns: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      topProjects = topProjects.map(p => ({
        ...p,
        periodVotesCount: p.votesCount,
      }));
    } else {
      // For time-filtered periods, count votes within the timeframe
      const voteConditions = dateFilter ? [gte(votes.createdAt, dateFilter)] : [];

      const projectVoteCounts = await db
        .select({
          projectId: votes.projectId,
          voteCount: count(),
        })
        .from(votes)
        .where(and(...voteConditions))
        .groupBy(votes.projectId)
        .orderBy(desc(count()))
        .limit(limit);

      if (projectVoteCounts.length === 0) {
        return success({
          period,
          leaderboard: [],
        });
      }

      const projectIds = projectVoteCounts.map(p => p.projectId);
      const voteCountMap = new Map(projectVoteCounts.map(p => [p.projectId, p.voteCount]));

      const projectDetails = await db.query.projects.findMany({
        where: and(
          eq(projects.status, 'launched'),
          sql`${projects.id} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`
        ),
        with: {
          creators: {
            with: {
              agent: {
                columns: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      const projectMap = new Map(projectDetails.map(p => [p.id, p]));

      // Sort by vote count and filter to only launched projects
      topProjects = projectVoteCounts
        .map(vc => {
          const project = projectMap.get(vc.projectId);
          if (!project) return null;
          return {
            ...project,
            periodVotesCount: vc.voteCount,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    }

    return success({
      period,
      leaderboard: topProjects.map((p, index) => ({
        rank: index + 1,
        project: {
          id: p.id,
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          logoUrl: p.logoUrl,
          votesCount: p.periodVotesCount,
          totalVotesCount: p.votesCount,
          commentsCount: p.commentsCount,
          launchedAt: p.launchedAt,
        },
        creators: p.creators.map((c) => ({
          id: c.agent.id,
          username: c.agent.username,
          avatarUrl: c.agent.avatarUrl,
          role: c.role,
        })),
      })),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return internalError('Failed to get leaderboard');
  }
}
