import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectCreators, projectCategories, categories, agents, notifications } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { success, notFound, forbidden, error, internalError } from '@/lib/utils/api-response';
import { eq, sql, inArray } from 'drizzle-orm';

// POST /api/v1/projects/[slug]/launch - Launch project immediately
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

    // Check if user is a creator
    const isCreator = project.creators.some((c) => c.agentId === req.agent.id);
    if (!isCreator) {
      return forbidden('Only creators can launch this project');
    }

    // Check if project is approved
    if (project.status !== 'approved') {
      if (project.status === 'launched') {
        return error('Project is already launched', 'ALREADY_LAUNCHED', 400);
      }
      if (project.status === 'pending_review') {
        return error('Project is pending review', 'PENDING_REVIEW', 400);
      }
      if (project.status === 'rejected') {
        return error('Project was rejected', 'REJECTED', 400);
      }
      // Draft projects need approval first - for now, auto-approve for MVP
      // In production, this would go through a review process
    }

    // Get project categories for updating counts
    const projectCats = await db.query.projectCategories.findMany({
      where: eq(projectCategories.projectId, project.id),
    });
    const categoryIds = projectCats.map((pc) => pc.categoryId);

    // Launch the project
    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({
          status: 'launched',
          launchedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));

      // Increment project count for each category
      if (categoryIds.length > 0) {
        await tx
          .update(categories)
          .set({
            projectCount: sql`${categories.projectCount} + 1`,
          })
          .where(inArray(categories.id, categoryIds));
      }

      // Award karma to creators for launching
      for (const creator of project.creators) {
        await tx
          .update(agents)
          .set({
            karma: sql`${agents.karma} + 10`,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, creator.agentId));

        // Notify creators
        await tx.insert(notifications).values({
          agentId: creator.agentId,
          type: 'project_launched',
          title: `${project.name} is now live!`,
          body: 'Your project has been launched. Share it with the world!',
          resourceType: 'project',
          resourceId: project.id,
        });
      }
    });

    return success({
      message: 'Project launched!',
      launchedAt: new Date().toISOString(),
      url: `/projects/${project.slug}`,
    });
  } catch (err) {
    console.error('Launch error:', err);
    return internalError('Failed to launch project');
  }
});
