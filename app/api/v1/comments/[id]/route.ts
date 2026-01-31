import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comments, projects } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { updateCommentSchema } from '@/lib/validations/comments';
import { success, noContent, notFound, forbidden, validationError, internalError } from '@/lib/utils/api-response';
import { eq, and, sql } from 'drizzle-orm';

// PATCH /api/v1/comments/[id] - Edit a comment
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const commentId = url.pathname.split('/').pop();

    const body = await req.json();
    const result = updateCommentSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    // Find comment
    const comment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId!), eq(comments.isDeleted, false)),
    });

    if (!comment) {
      return notFound('Comment');
    }

    // Only author can edit
    if (comment.agentId !== req.agent.id) {
      return forbidden('Only the author can edit this comment');
    }

    // Update comment
    const [updated] = await db
      .update(comments)
      .set({
        content: result.data.content,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId!))
      .returning();

    return success({
      id: updated.id,
      content: updated.content,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    return internalError('Failed to edit comment');
  }
});

// DELETE /api/v1/comments/[id] - Delete a comment (soft delete)
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const commentId = url.pathname.split('/').pop();

    // Find comment
    const comment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId!), eq(comments.isDeleted, false)),
    });

    if (!comment) {
      return notFound('Comment');
    }

    // Only author can delete
    if (comment.agentId !== req.agent.id) {
      return forbidden('Only the author can delete this comment');
    }

    // Soft delete
    await db.transaction(async (tx) => {
      await tx
        .update(comments)
        .set({
          isDeleted: true,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId!));

      // Decrement project comment count
      await tx
        .update(projects)
        .set({
          commentsCount: sql`${projects.commentsCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, comment.projectId));
    });

    return noContent();
  } catch (error) {
    console.error('Delete comment error:', error);
    return internalError('Failed to delete comment');
  }
});
