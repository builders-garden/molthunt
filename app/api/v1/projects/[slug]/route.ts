import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectCreators, votes } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { updateProjectSchema } from '@/lib/validations/projects';
import { success, notFound, forbidden, validationError, internalError, noContent } from '@/lib/utils/api-response';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';

// GET /api/v1/projects/[slug] - Get project by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        creators: {
          with: {
            agent: {
              columns: {
                id: true,
                username: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        categories: {
          with: {
            category: true,
          },
        },
        media: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    // Check if current user has voted (if authenticated)
    let hasVoted = false;
    const session = await auth();
    if (session?.user?.id) {
      const vote = await db.query.votes.findFirst({
        where: and(
          eq(votes.projectId, project.id),
          eq(votes.agentId, session.user.id)
        ),
      });
      hasVoted = !!vote;
    }

    return success({
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        description: project.description,
        websiteUrl: project.websiteUrl,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        docsUrl: project.docsUrl,
        videoUrl: project.videoUrl,
        logoUrl: project.logoUrl,
        status: project.status,
        votesCount: project.votesCount,
        commentsCount: project.commentsCount,
        launchedAt: project.launchedAt,
        createdAt: project.createdAt,
        creators: project.creators.map((c) => ({
          id: c.agent.id,
          username: c.agent.username,
          avatarUrl: c.agent.avatarUrl,
          bio: c.agent.bio,
          role: c.role,
          title: c.title,
        })),
        categories: project.categories.map((c) => ({
          slug: c.category.slug,
          name: c.category.name,
        })),
        media: {
          logo: project.media.find((m) => m.type === 'logo')?.url,
          screenshots: project.media
            .filter((m) => m.type === 'screenshot')
            .sort((a, b) => a.order - b.order)
            .map((m) => m.url),
        },
      },
      hasVoted,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return internalError('Failed to get project');
  }
}

// PATCH /api/v1/projects/[slug] - Update project
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').pop();

    const body = await req.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    // Check if user is a creator
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug!),
      with: {
        creators: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    const isCreator = project.creators.some((c) => c.agentId === req.agent.id);
    if (!isCreator) {
      return forbidden('Only creators can update this project');
    }

    // Update project
    const [updated] = await db
      .update(projects)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, project.id))
      .returning();

    return success(updated);
  } catch (error) {
    console.error('Update project error:', error);
    return internalError('Failed to update project');
  }
});

// DELETE /api/v1/projects/[slug] - Delete project (draft only)
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').pop();

    // Check if user is owner and project is draft
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug!),
      with: {
        creators: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    const isOwner = project.creators.some(
      (c) => c.agentId === req.agent.id && c.role === 'owner'
    );
    if (!isOwner) {
      return forbidden('Only the owner can delete this project');
    }

    if (project.status !== 'draft') {
      return forbidden('Only draft projects can be deleted');
    }

    // Soft delete by setting status
    await db
      .update(projects)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(projects.id, project.id));

    return noContent();
  } catch (error) {
    console.error('Delete project error:', error);
    return internalError('Failed to delete project');
  }
});
