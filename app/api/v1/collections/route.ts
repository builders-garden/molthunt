import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { collections, collectionProjects, agents } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { createCollectionSchema } from '@/lib/validations/collections';
import { paginationSchema } from '@/lib/validations/common';
import { success, created, paginated, validationError, error, internalError } from '@/lib/utils/api-response';
import { eq, desc, count, or, and, sql } from 'drizzle-orm';
import { generateUniqueCollectionSlug } from '@/lib/utils/slug';

// GET /api/v1/collections - Get collections (featured or all public)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const paginationResult = paginationSchema.safeParse(Object.fromEntries(searchParams));
    const { page, limit } = paginationResult.success
      ? paginationResult.data
      : { page: 1, limit: 20 };
    const featuredOnly = searchParams.get('featured') === 'true';

    const conditions = [eq(collections.isPublic, true)];
    if (featuredOnly) {
      conditions.push(eq(collections.isFeatured, true));
    }

    const [data, totalResult] = await Promise.all([
      db.query.collections.findMany({
        where: and(...conditions),
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(collections.isFeatured), desc(collections.projectCount)],
        with: {
          agent: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.select({ count: count() }).from(collections).where(and(...conditions)),
    ]);

    return paginated(
      data.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        isFeatured: c.isFeatured,
        projectCount: c.projectCount,
        createdAt: c.createdAt,
        curator: c.agent,
      })),
      totalResult[0].count,
      page,
      limit
    );
  } catch (err) {
    console.error('Get collections error:', err);
    return internalError('Failed to get collections');
  }
}

// POST /api/v1/collections - Create a new collection
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Check if agent is verified
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, req.agent.id),
    });

    if (!agent?.emailVerified && !agent?.xVerified) {
      return error('Must be verified to create collections', 'NOT_VERIFIED', 403);
    }

    const body = await req.json();
    const result = createCollectionSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const { name, description, isPublic, project_ids } = result.data;
    const slug = await generateUniqueCollectionSlug(name);

    // Create collection in transaction
    const collection = await db.transaction(async (tx) => {
      const [newCollection] = await tx
        .insert(collections)
        .values({
          slug,
          agentId: req.agent.id,
          name,
          description,
          isPublic,
          projectCount: project_ids?.length || 0,
        })
        .returning();

      // Add initial projects if provided
      if (project_ids && project_ids.length > 0) {
        await tx.insert(collectionProjects).values(
          project_ids.map((projectId, index) => ({
            collectionId: newCollection.id,
            projectId,
            order: index,
          }))
        );
      }

      return newCollection;
    });

    return created({
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      projectCount: collection.projectCount,
    });
  } catch (err) {
    console.error('Create collection error:', err);
    return internalError('Failed to create collection');
  }
});
