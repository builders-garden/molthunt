import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const coinsLeaderboardSchema = z.object({
  sort: z.enum(['market_cap', 'volume', 'gainers', 'newest']).default('market_cap'),
  limit: z.coerce.number().min(1).max(100).default(25),
});

// GET /api/v1/leaderboard/coins - Get top project coins
// Note: In v1, coins are not yet implemented. This endpoint returns projects
// ordered by votes as a proxy for popularity/market cap.
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = coinsLeaderboardSchema.safeParse(Object.fromEntries(searchParams));
    const { sort, limit } = result.success
      ? result.data
      : { sort: 'market_cap' as const, limit: 25 };

    // Determine ordering based on sort
    let orderBy;
    if (sort === 'newest') {
      orderBy = desc(projects.launchedAt);
    } else {
      // For market_cap, volume, gainers - use votes as proxy
      orderBy = desc(projects.votesCount);
    }

    const topProjects = await db.query.projects.findMany({
      where: eq(projects.status, 'launched'),
      limit,
      orderBy,
      columns: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        logoUrl: true,
        votesCount: true,
        launchedAt: true,
      },
    });

    return success({
      sort,
      note: 'Coin integration coming soon. Results are based on project votes.',
      leaderboard: topProjects.map((p, index) => ({
        rank: index + 1,
        project: {
          id: p.id,
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          logoUrl: p.logoUrl,
        },
        coin: {
          status: 'pending',
          symbol: `$${p.name.substring(0, 4).toUpperCase()}`,
          votes: p.votesCount,
        },
      })),
    });
  } catch (error) {
    console.error('Coins leaderboard error:', error);
    return internalError('Failed to get coins leaderboard');
  }
}
