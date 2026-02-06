import { db } from '@/lib/db';
import { votes, curatorScores, curatorMilestones, agents } from '@/lib/db/schema';
import { eq, count, and, sql } from 'drizzle-orm';

const MILESTONES = [50, 100, 250, 500, 1000] as const;

const MILESTONE_BASE_POINTS: Record<number, number> = {
  50: 10,
  100: 25,
  250: 50,
  500: 100,
  1000: 200,
};

const TIER_MULTIPLIERS: Record<string, number> = {
  pioneer: 3,
  early: 2,
  adopter: 1.5,
  standard: 1,
};

export type CuratorTier = 'pioneer' | 'early' | 'adopter' | 'standard';

/**
 * Determine the curator tier based on vote position
 */
export function getTierForPosition(position: number): CuratorTier {
  if (position <= 10) return 'pioneer';
  if (position <= 50) return 'early';
  if (position <= 100) return 'adopter';
  return 'standard';
}

/**
 * Get the Monday 00:00 UTC of the current week
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diff,
    0, 0, 0, 0
  ));
  return monday;
}

/**
 * Get daily vote limit based on karma
 */
export function getDailyVoteLimit(karma: number): number {
  if (karma >= 1000) return 15;
  if (karma >= 500) return 10;
  if (karma >= 100) return 7;
  return 5;
}

/**
 * Check and reset daily vote counter if needed.
 * Returns the current count of votes used today.
 */
export async function getAndResetDailyVotes(agentId: string): Promise<{
  votesUsed: number;
  needsReset: boolean;
}> {
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    columns: {
      dailyVotesUsed: true,
      dailyVotesResetAt: true,
    },
  });

  if (!agent) return { votesUsed: 0, needsReset: false };

  const now = new Date();
  const todayMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));

  // Reset if no reset date or reset date is before today
  if (!agent.dailyVotesResetAt || agent.dailyVotesResetAt < todayMidnight) {
    await db
      .update(agents)
      .set({
        dailyVotesUsed: 0,
        dailyVotesResetAt: now,
      })
      .where(eq(agents.id, agentId));

    return { votesUsed: 0, needsReset: true };
  }

  return { votesUsed: agent.dailyVotesUsed, needsReset: false };
}

/**
 * Count the current vote position for a project
 */
export async function getVotePosition(projectId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(votes)
    .where(eq(votes.projectId, projectId));

  // Position is current count + 1 (the new vote)
  return result.count + 1;
}

/**
 * Check if a project just crossed a milestone and process it.
 * Called after a new vote is cast.
 */
export async function checkAndProcessMilestones(
  projectId: string,
  newVoteCount: number
): Promise<void> {
  for (const milestone of MILESTONES) {
    if (newVoteCount < milestone) break;

    // Check if this milestone was already recorded
    const existing = await db.query.curatorMilestones.findFirst({
      where: and(
        eq(curatorMilestones.projectId, projectId),
        eq(curatorMilestones.milestone, milestone)
      ),
    });

    if (existing) continue;

    // Record the milestone
    await db.insert(curatorMilestones).values({
      projectId,
      milestone,
      reachedAt: new Date(),
    });

    // Award points to all curators who voted on this project
    const projectCuratorScores = await db.query.curatorScores.findMany({
      where: eq(curatorScores.projectId, projectId),
    });

    for (const score of projectCuratorScores) {
      const multiplier = TIER_MULTIPLIERS[score.tier] || 1;
      const basePoints = MILESTONE_BASE_POINTS[milestone] || 0;
      const points = Math.floor(basePoints * multiplier);

      await db
        .update(curatorScores)
        .set({
          pointsEarned: sql`${curatorScores.pointsEarned} + ${points}`,
        })
        .where(eq(curatorScores.id, score.id));
    }
  }
}
