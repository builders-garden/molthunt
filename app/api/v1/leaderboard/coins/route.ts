import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectTokens } from '@/lib/db/schema';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, desc, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';

const coinsLeaderboardSchema = z.object({
  sort: z.enum(['market_cap', 'volume', 'gainers', 'newest']).default('market_cap'),
  limit: z.coerce.number().min(1).max(100).default(25),
});

// GET /api/v1/leaderboard/coins - Get top project coins
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = coinsLeaderboardSchema.safeParse(Object.fromEntries(searchParams));
    const { sort, limit } = result.success
      ? result.data
      : { sort: 'market_cap' as const, limit: 25 };

    // Query projects with tokens
    const projectsWithTokens = await db.query.projects.findMany({
      where: eq(projects.status, 'launched'),
      with: {
        token: true,
      },
    });

    // Filter to only projects with tokens
    let tokensData = projectsWithTokens
      .filter((p) => p.token !== null)
      .map((p) => ({
        project: p,
        token: p.token!,
      }));

    // Sort based on parameter
    if (sort === 'market_cap') {
      tokensData.sort((a, b) => {
        const mcA = parseFloat(a.token.marketCap || '0');
        const mcB = parseFloat(b.token.marketCap || '0');
        return mcB - mcA;
      });
    } else if (sort === 'volume') {
      tokensData.sort((a, b) => {
        const volA = parseFloat(a.token.volume24h || '0');
        const volB = parseFloat(b.token.volume24h || '0');
        return volB - volA;
      });
    } else if (sort === 'gainers') {
      tokensData.sort((a, b) => {
        const changeA = parseFloat(a.token.priceChange24h || '0');
        const changeB = parseFloat(b.token.priceChange24h || '0');
        return changeB - changeA;
      });
    } else if (sort === 'newest') {
      tokensData.sort((a, b) => {
        const dateA = a.token.createdAt?.getTime() || 0;
        const dateB = b.token.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
    }

    // Apply limit
    tokensData = tokensData.slice(0, limit);

    return success({
      sort,
      leaderboard: tokensData.map((item, index) => ({
        rank: index + 1,
        project: {
          id: item.project.id,
          slug: item.project.slug,
          name: item.project.name,
          tagline: item.project.tagline,
          logoUrl: item.project.logoUrl,
        },
        coin: {
          address: item.token.address,
          symbol: item.token.symbol,
          name: item.token.name,
          chain: item.token.chain,
          launchedVia: item.token.launchedVia,
          priceUsd: item.token.priceUsd,
          marketCap: item.token.marketCap,
          holders: item.token.holders,
          priceChange24h: item.token.priceChange24h,
          volume24h: item.token.volume24h,
          dexUrl: item.token.dexUrl,
        },
      })),
    });
  } catch (error) {
    console.error('Coins leaderboard error:', error);
    return internalError('Failed to get coins leaderboard');
  }
}
