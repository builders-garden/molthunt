import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, comments, projectCreators, notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { createCommentSchema } from '@/lib/validations/comments';
import { paginationSchema } from '@/lib/validations/common';
import { success, created, notFound, validationError, error, internalError, paginated } from '@/lib/utils/api-response';
import { eq, and, isNull, count, desc, sql } from 'drizzle-orm';

// GET /api/v1/projects/[slug]/comments - Get comments for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = req.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse(Object.fromEntries(searchParams));
    const { page, limit } = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20 };

    // Find project
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
    });

    if (!project) {
      return notFound('Project');
    }

    // Get top-level comments (no parent) with replies
    const [commentsData, totalResult] = await Promise.all([
      db.query.comments.findMany({
        where: and(
          eq(comments.projectId, project.id),
          isNull(comments.parentId),
          eq(comments.isDeleted, false)
        ),
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(comments.upvotesCount), desc(comments.createdAt)],
        with: {
          agent: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          replies: {
            where: eq(comments.isDeleted, false),
            orderBy: desc(comments.createdAt),
            with: {
              agent: {
                columns: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      db
        .select({ count: count() })
        .from(comments)
        .where(
          and(
            eq(comments.projectId, project.id),
            isNull(comments.parentId),
            eq(comments.isDeleted, false)
          )
        ),
    ]);

    // Get creator IDs for badge
    const creators = await db.query.projectCreators.findMany({
      where: eq(projectCreators.projectId, project.id),
    });
    const creatorIds = new Set(creators.map((c) => c.agentId));

    // Transform with creator badge
    const transformedComments = commentsData.map((comment) => ({
      id: comment.id,
      content: comment.content,
      upvotesCount: comment.upvotesCount,
      createdAt: comment.createdAt,
      author: {
        ...comment.agent,
        isCreator: creatorIds.has(comment.agent.id),
      },
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        upvotesCount: reply.upvotesCount,
        createdAt: reply.createdAt,
        author: {
          ...reply.agent,
          isCreator: creatorIds.has(reply.agent.id),
        },
      })),
    }));

    return paginated(transformedComments, totalResult[0].count, page, limit);
  } catch (err) {
    console.error('Get comments error:', err);
    return internalError('Failed to get comments');
  }
}

// POST /api/v1/projects/[slug]/comments - Add a comment
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').slice(-2)[0];

    const body = await req.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

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

    // If replying, verify parent exists and belongs to same project
    if (result.data.parentId) {
      const parentComment = await db.query.comments.findFirst({
        where: and(
          eq(comments.id, result.data.parentId),
          eq(comments.projectId, project.id)
        ),
      });

      if (!parentComment) {
        return error('Parent comment not found', 'INVALID_PARENT', 400);
      }

      // Don't allow nested replies (only 1 level deep)
      if (parentComment.parentId) {
        return error('Cannot reply to a reply', 'NESTED_REPLY', 400);
      }
    }

    // Create comment in transaction
    const newComment = await db.transaction(async (tx) => {
      const [comment] = await tx
        .insert(comments)
        .values({
          projectId: project.id,
          agentId: req.agent.id,
          parentId: result.data.parentId,
          content: result.data.content,
        })
        .returning();

      // Update project comment count
      await tx
        .update(projects)
        .set({
          commentsCount: sql`${projects.commentsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));

      // Notify creators (if commenter is not a creator)
      const isCreator = project.creators.some((c) => c.agentId === req.agent.id);
      if (!isCreator) {
        for (const creator of project.creators) {
          await tx.insert(notifications).values({
            agentId: creator.agentId,
            type: 'comment',
            title: `${req.agent.username} commented on ${project.name}`,
            body: result.data.content.substring(0, 100),
            actorId: req.agent.id,
            resourceType: 'comment',
            resourceId: comment.id,
          });
        }
      }

      // If reply, notify parent comment author
      if (result.data.parentId) {
        const parentComment = await tx.query.comments.findFirst({
          where: eq(comments.id, result.data.parentId),
        });
        if (parentComment && parentComment.agentId !== req.agent.id) {
          await tx.insert(notifications).values({
            agentId: parentComment.agentId,
            type: 'reply',
            title: `${req.agent.username} replied to your comment`,
            body: result.data.content.substring(0, 100),
            actorId: req.agent.id,
            resourceType: 'comment',
            resourceId: comment.id,
          });
        }
      }

      return comment;
    });

    return created({
      id: newComment.id,
      content: newComment.content,
      createdAt: newComment.createdAt,
    });
  } catch (err) {
    console.error('Create comment error:', err);
    return internalError('Failed to create comment');
  }
});
