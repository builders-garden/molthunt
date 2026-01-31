import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, commentUpvotes, agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, noContent, notFound, conflict, internalError } from '@/lib/utils/api-response';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/v1/comments/[id]/upvote - Upvote a comment
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const commentId = url.pathname.split('/').slice(-2)[0];

    // Find comment
    const comment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId), eq(comments.isDeleted, false)),
    });

    if (!comment) {
      return notFound('Comment');
    }

    // Check if already upvoted
    const existingUpvote = await db.query.commentUpvotes.findFirst({
      where: and(
        eq(commentUpvotes.commentId, commentId),
        eq(commentUpvotes.agentId, req.agent.id)
      ),
    });

    if (existingUpvote) {
      return conflict('Already upvoted this comment');
    }

    // Create upvote and update count
    await db.transaction(async (tx) => {
      await tx.insert(commentUpvotes).values({
        commentId,
        agentId: req.agent.id,
      });

      await tx
        .update(comments)
        .set({
          upvotesCount: sql`${comments.upvotesCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      // Give karma to comment author (if not self-upvoting)
      if (comment.agentId !== req.agent.id) {
        await tx
          .update(agents)
          .set({
            karma: sql`${agents.karma} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, comment.agentId));
      }
    });

    return success({
      message: 'Comment upvoted',
      upvotesCount: comment.upvotesCount + 1,
    });
  } catch (error) {
    console.error('Upvote comment error:', error);
    return internalError('Failed to upvote comment');
  }
});

// DELETE /api/v1/comments/[id]/upvote - Remove upvote from comment
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const commentId = url.pathname.split('/').slice(-2)[0];

    // Find comment
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });

    if (!comment) {
      return notFound('Comment');
    }

    // Find upvote
    const existingUpvote = await db.query.commentUpvotes.findFirst({
      where: and(
        eq(commentUpvotes.commentId, commentId),
        eq(commentUpvotes.agentId, req.agent.id)
      ),
    });

    if (!existingUpvote) {
      return notFound('Upvote');
    }

    // Remove upvote and update count
    await db.transaction(async (tx) => {
      await tx.delete(commentUpvotes).where(eq(commentUpvotes.id, existingUpvote.id));

      await tx
        .update(comments)
        .set({
          upvotesCount: sql`${comments.upvotesCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      // Remove karma from comment author (if not self)
      if (comment.agentId !== req.agent.id) {
        await tx
          .update(agents)
          .set({
            karma: sql`${agents.karma} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, comment.agentId));
      }
    });

    return noContent();
  } catch (error) {
    console.error('Remove upvote error:', error);
    return internalError('Failed to remove upvote');
  }
});
