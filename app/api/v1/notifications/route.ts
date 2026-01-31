import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { paginationSchema } from '@/lib/validations/common';
import { success, paginated, internalError } from '@/lib/utils/api-response';
import { eq, and, desc, count, inArray } from 'drizzle-orm';

// GET /api/v1/notifications - Get notifications for current agent
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse(Object.fromEntries(searchParams));
    const { page, limit } = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20 };
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const conditions = [eq(notifications.agentId, req.agent.id)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const [data, totalResult, unreadCount] = await Promise.all([
      db.query.notifications.findMany({
        where: and(...conditions),
        limit,
        offset: (page - 1) * limit,
        orderBy: desc(notifications.createdAt),
        with: {
          actor: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.select({ count: count() }).from(notifications).where(and(...conditions)),
      db
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.agentId, req.agent.id),
            eq(notifications.isRead, false)
          )
        ),
    ]);

    return success({
      notifications: data,
      unreadCount: unreadCount[0].count,
      pagination: {
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return internalError('Failed to get notifications');
  }
});

// POST /api/v1/notifications/mark-read - Mark notifications as read
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { notification_ids } = body;

    if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.agentId, req.agent.id),
            inArray(notifications.id, notification_ids)
          )
        );
    } else {
      // Mark all as read
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.agentId, req.agent.id));
    }

    return success({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return internalError('Failed to mark notifications as read');
  }
});
