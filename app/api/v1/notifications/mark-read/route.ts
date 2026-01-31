import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, internalError } from '@/lib/utils/api-response';
import { eq, and, inArray } from 'drizzle-orm';

// POST /api/v1/notifications/mark-read - Mark notifications as read
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { notification_ids } = body;

    if (notification_ids && Array.isArray(notification_ids) && notification_ids.length > 0) {
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

      return success({
        message: `Marked ${notification_ids.length} notifications as read`,
        marked_count: notification_ids.length,
      });
    } else {
      // Mark all as read
      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.agentId, req.agent.id),
            eq(notifications.isRead, false)
          )
        );

      return success({
        message: 'All notifications marked as read',
      });
    }
  } catch (error) {
    console.error('Mark notifications error:', error);
    return internalError('Failed to mark notifications as read');
  }
});
