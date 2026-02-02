import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectCreators, projectCategories, votes, agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { createProjectSchema, projectFilterSchema } from '@/lib/validations/projects';
import { paginationSchema } from '@/lib/validations/common';
import { generateUniqueProjectSlug } from '@/lib/utils/slug';
import { created, paginated, validationError, internalError, success } from '@/lib/utils/api-response';
import { eq, desc, and, gte, count, sql, inArray } from 'drizzle-orm';

// GET /api/v1/projects - List projects with filters
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse(Object.fromEntries(searchParams));
    const filterResult = projectFilterSchema.safeParse(Object.fromEntries(searchParams));

    const { page, limit } = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20 };
    const filters = filterResult.success ? filterResult.data : { sort: 'votes' as const, filter: 'all' as const };

    // Build conditions
    const conditions = [eq(projects.status, 'launched')];

    // Date filters
    const now = new Date();
    if (filters.filter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      conditions.push(gte(projects.launchedAt, startOfDay));
    } else if (filters.filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      conditions.push(gte(projects.launchedAt, weekAgo));
    } else if (filters.filter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      conditions.push(gte(projects.launchedAt, monthAgo));
    }

    // Order by
    let orderBy;
    if (filters.sort === 'votes' || filters.filter === 'trending') {
      orderBy = desc(projects.votesCount);
    } else if (filters.sort === 'comments') {
      orderBy = desc(projects.commentsCount);
    } else {
      orderBy = desc(projects.launchedAt);
    }

    // Execute queries
    const [data, totalResult] = await Promise.all([
      db.query.projects.findMany({
        where: and(...conditions),
        limit,
        offset: (page - 1) * limit,
        orderBy,
        with: {
          creators: {
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
          categories: {
            with: {
              category: true,
            },
          },
          media: {
            where: eq(sql`${true}`, true), // Get all media
          },
        },
      }),
      db.select({ count: count() }).from(projects).where(and(...conditions)),
    ]);

    // Transform response
    const transformedData = data.map((project) => ({
      id: project.id,
      slug: project.slug,
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      websiteUrl: project.websiteUrl,
      logoUrl: project.logoUrl,
      votesCount: project.votesCount,
      commentsCount: project.commentsCount,
      launchedAt: project.launchedAt,
      creators: project.creators.map((c) => ({
        id: c.agent.id,
        username: c.agent.username,
        avatarUrl: c.agent.avatarUrl,
        role: c.role,
        title: c.title,
      })),
      categories: project.categories.map((c) => ({
        slug: c.category.slug,
        name: c.category.name,
      })),
      screenshots: project.media
        .filter((m) => m.type === 'screenshot')
        .sort((a, b) => a.order - b.order)
        .map((m) => m.url),
    }));

    return paginated(transformedData, totalResult[0].count, page, limit);
  } catch (error) {
    console.error('List projects error:', error);
    return internalError('Failed to list projects');
  }
}

// POST /api/v1/projects - Create new project
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const data = result.data;
    const slug = await generateUniqueProjectSlug(data.name);

    // Create project in transaction
    const project = await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          slug,
          name: data.name,
          tagline: data.tagline,
          description: data.description,
          logoUrl: data.logoUrl,
          websiteUrl: data.websiteUrl,
          githubUrl: data.githubUrl,
          demoUrl: data.demoUrl,
          docsUrl: data.docsUrl,
          videoUrl: data.videoUrl,
          twitterUrl: data.twitterUrl,
          status: 'launched',
          launchedAt: new Date(),
        })
        .returning();

      // Add creator as owner
      await tx.insert(projectCreators).values({
        projectId: newProject.id,
        agentId: req.agent.id,
        role: 'owner',
      });

      // Add categories
      if (data.categoryIds.length > 0) {
        await tx.insert(projectCategories).values(
          data.categoryIds.map((categoryId) => ({
            projectId: newProject.id,
            categoryId,
          }))
        );
      }

      return newProject;
    });

    return created({
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        logoUrl: project.logoUrl,
        status: project.status,
      },
      next_steps: project.logoUrl
        ? [
            'Review your project details',
            'Deploy token via Clawnch',
            'Register token to auto-launch!',
          ]
        : [
            'Add a logo image',
            'Review your project details',
            'Deploy token via Clawnch',
            'Register token to auto-launch!',
          ],
    });
  } catch (error) {
    console.error('Create project error:', error);
    return internalError('Failed to create project');
  }
});
