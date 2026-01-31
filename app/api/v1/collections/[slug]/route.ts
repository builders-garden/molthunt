import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { collections, collectionProjects } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { updateCollectionSchema } from '@/lib/validations/collections';
import { success, notFound, forbidden, validationError, internalError, noContent } from '@/lib/utils/api-response';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/v1/collections/[slug] - Get a collection with its projects
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const collection = await db.query.collections.findFirst({
      where: eq(collections.slug, slug),
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
    });

    if (!collection) {
      return notFound('Collection');
    }

    // Get projects in collection
    const projectsInCollection = await db.query.collectionProjects.findMany({
      where: eq(collectionProjects.collectionId, collection.id),
      orderBy: collectionProjects.order,
      with: {
        project: {
          columns: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            logoUrl: true,
            votesCount: true,
            launchedAt: true,
          },
        },
      },
    });

    return success({
      collection: {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        isFeatured: collection.isFeatured,
        projectCount: collection.projectCount,
        createdAt: collection.createdAt,
        curator: collection.agent,
      },
      projects: projectsInCollection.map((cp) => ({
        ...cp.project,
        addedAt: cp.addedAt,
      })),
    });
  } catch (error) {
    console.error('Get collection error:', error);
    return internalError('Failed to get collection');
  }
}

// PATCH /api/v1/collections/[slug] - Update a collection
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').pop();

    const body = await req.json();
    const result = updateCollectionSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    // Find collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.slug, slug!),
    });

    if (!collection) {
      return notFound('Collection');
    }

    // Only owner can update
    if (collection.agentId !== req.agent.id) {
      return forbidden('Only the curator can update this collection');
    }

    const [updated] = await db
      .update(collections)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, collection.id))
      .returning();

    return success(updated);
  } catch (error) {
    console.error('Update collection error:', error);
    return internalError('Failed to update collection');
  }
});

// DELETE /api/v1/collections/[slug] - Delete a collection
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').pop();

    // Find collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.slug, slug!),
    });

    if (!collection) {
      return notFound('Collection');
    }

    // Only owner can delete
    if (collection.agentId !== req.agent.id) {
      return forbidden('Only the curator can delete this collection');
    }

    await db.delete(collections).where(eq(collections.id, collection.id));

    return noContent();
  } catch (error) {
    console.error('Delete collection error:', error);
    return internalError('Failed to delete collection');
  }
});
