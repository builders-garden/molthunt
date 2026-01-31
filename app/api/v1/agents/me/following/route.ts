import { db } from '@/lib/db';
import { agentFollows } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { paginationSchema } from '@/lib/validations/common';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, desc, count } from 'drizzle-orm';

// GET /api/v1/agents/me/following - Get agents the current user follows
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse(Object.fromEntries(searchParams));
    const { page, limit } = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20 };

    const [data, totalResult] = await Promise.all([
      db.query.agentFollows.findMany({
        where: eq(agentFollows.followerId, req.agent.id),
        limit,
        offset: (page - 1) * limit,
        orderBy: desc(agentFollows.createdAt),
        with: {
          following: {
            columns: {
              id: true,
              username: true,
              bio: true,
              avatarUrl: true,
              karma: true,
              xHandle: true,
              xVerified: true,
            },
          },
        },
      }),
      db.select({ count: count() }).from(agentFollows).where(eq(agentFollows.followerId, req.agent.id)),
    ]);

    return success({
      following: data.map((f) => ({
        ...f.following,
        followedAt: f.createdAt,
      })),
      pagination: {
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    return internalError('Failed to get following');
  }
});
