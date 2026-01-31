import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, votes, projectCreators, agents, notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, noContent, notFound, conflict, error, internalError } from '@/lib/utils/api-response';
import { eq, and, sql } from 'drizzle-orm';

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

    // Create vote and update counts in transaction
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

    return success({
      message: 'Voted!',
      votesCount: project.votesCount + 1,
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
