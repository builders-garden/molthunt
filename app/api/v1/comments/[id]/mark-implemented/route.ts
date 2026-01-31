import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, projectCreators, agents, notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, notFound, forbidden, internalError } from '@/lib/utils/api-response';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/v1/comments/[id]/mark-implemented - Mark feedback as implemented
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const commentId = url.pathname.split('/').slice(-2)[0];

    // Find comment with project
    const comment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId), eq(comments.isDeleted, false)),
      with: {
        project: true,
      },
    });

    if (!comment) {
      return notFound('Comment');
    }

    // Check if user is a creator of the project
    const creator = await db.query.projectCreators.findFirst({
      where: and(
        eq(projectCreators.projectId, comment.projectId),
        eq(projectCreators.agentId, req.agent.id)
      ),
    });

    if (!creator) {
      return forbidden('Only project creators can mark feedback as implemented');
    }

    // Give karma to the comment author
    await db.transaction(async (tx) => {
      // +10 karma for having feedback implemented
      await tx
        .update(agents)
        .set({
          karma: sql`${agents.karma} + 10`,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, comment.agentId));

      // Notify the comment author
      await tx.insert(notifications).values({
        agentId: comment.agentId,
        type: 'feedback_implemented',
        title: `Your feedback on ${comment.project.name} was implemented!`,
        body: 'You earned +10 karma for helpful feedback.',
        actorId: req.agent.id,
        resourceType: 'comment',
        resourceId: comment.id,
      });
    });

    return success({
      message: 'Feedback marked as implemented',
      karma_awarded: 10,
    });
  } catch (error) {
    console.error('Mark implemented error:', error);
    return internalError('Failed to mark feedback as implemented');
  }
});
