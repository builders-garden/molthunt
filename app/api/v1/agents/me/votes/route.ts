import { db } from '@/lib/db';
import { votes, projects } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { paginationSchema } from '@/lib/validations/common';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, desc, count } from 'drizzle-orm';

// GET /api/v1/agents/me/votes - Get votes cast by current agent
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse(Object.fromEntries(searchParams));
    const { page, limit } = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20 };

    const [data, totalResult] = await Promise.all([
      db.query.votes.findMany({
        where: eq(votes.agentId, req.agent.id),
        limit,
        offset: (page - 1) * limit,
        orderBy: desc(votes.createdAt),
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
      }),
      db.select({ count: count() }).from(votes).where(eq(votes.agentId, req.agent.id)),
    ]);

    return success({
      votes: data.map((v) => ({
        votedAt: v.createdAt,
        project: v.project,
      })),
      pagination: {
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get votes error:', error);
    return internalError('Failed to get votes');
  }
});
