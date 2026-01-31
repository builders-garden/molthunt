import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { collections, collectionProjects, projects } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { addProjectToCollectionSchema } from '@/lib/validations/collections';
import { success, notFound, forbidden, conflict, validationError, internalError, noContent } from '@/lib/utils/api-response';
import { eq, and, sql, max } from 'drizzle-orm';

// POST /api/v1/collections/[slug]/projects - Add a project to collection
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').slice(-2)[0];

    const body = await req.json();
    const result = addProjectToCollectionSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    // Find collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.slug, slug),
    });

    if (!collection) {
      return notFound('Collection');
    }

    // Only owner can add projects
    if (collection.agentId !== req.agent.id) {
      return forbidden('Only the curator can add projects to this collection');
    }

    // Check if project exists
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, result.data.project_id),
    });

    if (!project) {
      return notFound('Project');
    }

    // Check if project is already in collection
    const existing = await db.query.collectionProjects.findFirst({
      where: and(
        eq(collectionProjects.collectionId, collection.id),
        eq(collectionProjects.projectId, result.data.project_id)
      ),
    });

    if (existing) {
      return conflict('Project is already in this collection');
    }

    // Get max order
    const [maxOrderResult] = await db
      .select({ maxOrder: max(collectionProjects.order) })
      .from(collectionProjects)
      .where(eq(collectionProjects.collectionId, collection.id));

    const nextOrder = (maxOrderResult.maxOrder || 0) + 1;

    // Add project to collection
    await db.transaction(async (tx) => {
      await tx.insert(collectionProjects).values({
        collectionId: collection.id,
        projectId: result.data.project_id,
        order: nextOrder,
      });

      await tx
        .update(collections)
        .set({
          projectCount: sql`${collections.projectCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, collection.id));
    });

    return success({
      message: 'Project added to collection',
      projectCount: collection.projectCount + 1,
    });
  } catch (error) {
    console.error('Add project to collection error:', error);
    return internalError('Failed to add project to collection');
  }
});

// DELETE /api/v1/collections/[slug]/projects - Remove a project from collection
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/').slice(-2)[0];

    const body = await req.json();
    const { project_id } = body;

    if (!project_id) {
      return validationError('project_id is required', []);
    }

    // Find collection
    const collection = await db.query.collections.findFirst({
      where: eq(collections.slug, slug),
    });

    if (!collection) {
      return notFound('Collection');
    }

    // Only owner can remove projects
    if (collection.agentId !== req.agent.id) {
      return forbidden('Only the curator can remove projects from this collection');
    }

    // Find project in collection
    const existing = await db.query.collectionProjects.findFirst({
      where: and(
        eq(collectionProjects.collectionId, collection.id),
        eq(collectionProjects.projectId, project_id)
      ),
    });

    if (!existing) {
      return notFound('Project in collection');
    }

    // Remove project from collection
    await db.transaction(async (tx) => {
      await tx.delete(collectionProjects).where(eq(collectionProjects.id, existing.id));

      await tx
        .update(collections)
        .set({
          projectCount: sql`${collections.projectCount} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(collections.id, collection.id));
    });

    return noContent();
  } catch (error) {
    console.error('Remove project from collection error:', error);
    return internalError('Failed to remove project from collection');
  }
});
