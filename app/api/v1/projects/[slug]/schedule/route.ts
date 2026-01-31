import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectCreators } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { scheduleProjectSchema } from '@/lib/validations/projects';
import { success, notFound, forbidden, validationError, error, internalError } from '@/lib/utils/api-response';
import { eq } from 'drizzle-orm';

// POST /api/v1/projects/[slug]/schedule - Schedule project launch
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').slice(-2)[0];

    const body = await req.json();
    const result = scheduleProjectSchema.safeParse(body);

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

    // Check if user is a creator
    const isCreator = project.creators.some((c) => c.agentId === req.agent.id);
    if (!isCreator) {
      return forbidden('Only creators can schedule this project');
    }

    // Check if project can be scheduled
    if (project.status === 'launched') {
      return error('Project is already launched', 'ALREADY_LAUNCHED', 400);
    }
    if (project.status === 'rejected') {
      return error('Project was rejected', 'REJECTED', 400);
    }

    // Update project with scheduled launch date
    const [updated] = await db
      .update(projects)
      .set({
        scheduledLaunchAt: result.data.launchDate,
        status: project.status === 'draft' ? 'pending_review' : project.status,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
      .returning();

    return success({
      message: 'Launch scheduled',
      scheduledLaunchAt: updated.scheduledLaunchAt?.toISOString(),
      status: updated.status,
    });
  } catch (err) {
    console.error('Schedule error:', err);
    return internalError('Failed to schedule launch');
  }
});
