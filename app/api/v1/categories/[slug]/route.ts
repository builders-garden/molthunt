import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { categories, projectCategories, projects } from '@/lib/db/schema';
import { paginationSchema } from '@/lib/validations/common';
import { success, notFound, paginated, internalError } from '@/lib/utils/api-response';
import { eq, and, desc, count } from 'drizzle-orm';

// GET /api/v1/categories/[slug] - Get category with projects
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

    // Find category
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!category) {
      return notFound('Category');
    }

    // Get projects in this category
    const [projectsData, totalResult] = await Promise.all([
      db.query.projectCategories.findMany({
        where: eq(projectCategories.categoryId, category.id),
        limit,
        offset: (page - 1) * limit,
        with: {
          project: {
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
            },
          },
        },
      }),
      db
        .select({ count: count() })
        .from(projectCategories)
        .where(eq(projectCategories.categoryId, category.id)),
    ]);

    // Filter to only launched projects and transform
    const launchedProjects = projectsData
      .filter((pc) => pc.project.status === 'launched')
      .sort((a, b) => b.project.votesCount - a.project.votesCount)
      .map((pc) => ({
        id: pc.project.id,
        slug: pc.project.slug,
        name: pc.project.name,
        tagline: pc.project.tagline,
        logoUrl: pc.project.logoUrl,
        votesCount: pc.project.votesCount,
        commentsCount: pc.project.commentsCount,
        launchedAt: pc.project.launchedAt,
        creators: pc.project.creators.map((c) => ({
          id: c.agent.id,
          username: c.agent.username,
          avatarUrl: c.agent.avatarUrl,
        })),
      }));

    return success({
      category,
      projects: launchedProjects,
      pagination: {
        total: totalResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalResult[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    return internalError('Failed to get category');
  }
}
