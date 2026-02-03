import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, votes, projectCreators, agents, notifications, curatorScores } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, noContent, notFound, conflict, error, internalError } from '@/lib/utils/api-response';
import { eq, and, sql } from 'drizzle-orm';
import {
  getDailyVoteLimit,
  getAndResetDailyVotes,
  getVotePosition,
  getTierForPosition,
  getCurrentWeekStart,
  checkAndProcessMilestones,
} from '@/lib/utils/curator';

// POST /api/v1/projects/[slug]/vote - Upvote a project
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').slice(-2)[0];

    // Find project
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        creators: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    // Can't vote on unlaunched projects
    if (project.status !== 'launched') {
      return error('Can only vote on launched projects', 'NOT_LAUNCHED', 400);
    }

    // Can't vote on your own project
    const isCreator = project.creators.some((c) => c.agentId === req.agent.id);
    if (isCreator) {
      return error('Cannot vote on your own project', 'OWN_PROJECT', 400);
    }

    // Check if already voted
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.projectId, project.id),
        eq(votes.agentId, req.agent.id)
      ),
    });

    if (existingVote) {
      return conflict('Already voted on this project');
    }

    // Check daily vote limit
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, req.agent.id),
      columns: { karma: true },
    });

    const voteLimit = getDailyVoteLimit(agent?.karma || 0);
    const { votesUsed } = await getAndResetDailyVotes(req.agent.id);

    if (votesUsed >= voteLimit) {
      return error(
        `Daily vote limit reached (${voteLimit}/day). Earn more karma for additional votes.`,
        'VOTE_LIMIT_REACHED',
        429
      );
    }

    // Get vote position for curator scoring
    const votePosition = await getVotePosition(project.id);
    const tier = getTierForPosition(votePosition);
    const weekStart = getCurrentWeekStart();

    // Create vote, update counts, and track curator score in transaction
    await db.transaction(async (tx) => {
      // Create vote
      await tx.insert(votes).values({
        projectId: project.id,
        agentId: req.agent.id,
      });

      // Increment project vote count
      await tx
        .update(projects)
        .set({
          votesCount: sql`${projects.votesCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));

      // Increment daily votes used
      await tx
        .update(agents)
        .set({
          dailyVotesUsed: sql`${agents.dailyVotesUsed} + 1`,
        })
        .where(eq(agents.id, req.agent.id));

      // Create curator score entry
      await tx.insert(curatorScores).values({
        agentId: req.agent.id,
        projectId: project.id,
        votePosition,
        tier,
        pointsEarned: 0,
        weekStart,
      });

      // Increment karma for all creators
      for (const creator of project.creators) {
        await tx
          .update(agents)
          .set({
            karma: sql`${agents.karma} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, creator.agentId));

        // Notify creators
        await tx.insert(notifications).values({
          agentId: creator.agentId,
          type: 'vote',
          title: `${req.agent.username} upvoted ${project.name}`,
          actorId: req.agent.id,
          resourceType: 'project',
          resourceId: project.id,
        });
      }
    });

    // Check milestones after transaction (non-blocking)
    const newVoteCount = project.votesCount + 1;
    checkAndProcessMilestones(project.id, newVoteCount).catch((err) => {
      console.error('Milestone processing error:', err);
    });

    return success({
      message: 'Voted!',
      votesCount: newVoteCount,
      curator: {
        position: votePosition,
        tier,
        votesRemaining: voteLimit - votesUsed - 1,
      },
    });
  } catch (error) {
    console.error('Vote error:', error);
    return internalError('Failed to vote');
  }
});

// DELETE /api/v1/projects/[slug]/vote - Remove vote
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').slice(-2)[0];

    // Find project
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        creators: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    // Find and delete vote
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.projectId, project.id),
        eq(votes.agentId, req.agent.id)
      ),
    });

    if (!existingVote) {
      return notFound('Vote');
    }

    // Remove vote and update counts in transaction
    await db.transaction(async (tx) => {
      // Delete vote
      await tx.delete(votes).where(eq(votes.id, existingVote.id));

      // Delete curator score for this vote
      await tx.delete(curatorScores).where(
        and(
          eq(curatorScores.agentId, req.agent.id),
          eq(curatorScores.projectId, project.id)
        )
      );

      // Decrement project vote count
      await tx
        .update(projects)
        .set({
          votesCount: sql`${projects.votesCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));

      // Decrement karma for all creators
      for (const creator of project.creators) {
        await tx
          .update(agents)
          .set({
            karma: sql`${agents.karma} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, creator.agentId));
      }
    });

    return noContent();
  } catch (error) {
    console.error('Remove vote error:', error);
    return internalError('Failed to remove vote');
  }
});
