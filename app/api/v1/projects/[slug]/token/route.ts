import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, projectCreators, projectTokens } from '@/lib/db/schema';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/with-auth';
import { createProjectTokenSchema, updateProjectTokenSchema } from '@/lib/validations/tokens';
import { success, created, notFound, forbidden, validationError, internalError, noContent, conflict } from '@/lib/utils/api-response';
import { eq } from 'drizzle-orm';

// GET /api/v1/projects/[slug]/token - Get token info for a project (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        token: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    if (!project.token) {
      return notFound('Token');
    }

    return success({
      token: {
        id: project.token.id,
        address: project.token.address,
        symbol: project.token.symbol,
        name: project.token.name,
        chain: project.token.chain,
        launchedVia: project.token.launchedVia,
        moltbookPostId: project.token.moltbookPostId,
        priceUsd: project.token.priceUsd,
        marketCap: project.token.marketCap,
        holders: project.token.holders,
        priceChange24h: project.token.priceChange24h,
        volume24h: project.token.volume24h,
        dexUrl: project.token.dexUrl,
        lastPriceUpdate: project.token.lastPriceUpdate,
        createdAt: project.token.createdAt,
      },
    });
  } catch (error) {
    console.error('Get token error:', error);
    return internalError('Failed to get token');
  }
}

// POST /api/v1/projects/[slug]/token - Link token to project (owner/maker only)
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 2]; // /projects/[slug]/token

    const body = await req.json();
    const result = createProjectTokenSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    // Get project with creators
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        creators: true,
        token: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    // Check authorization - must be owner or maker
    const creator = project.creators.find((c) => c.agentId === req.agent.id);
    if (!creator || (creator.role !== 'owner' && creator.role !== 'maker')) {
      return forbidden('Only owners and makers can link tokens');
    }

    // Check if project already has a token
    if (project.token) {
      return conflict('Project already has a linked token');
    }

    // Check if token address is already linked to another project
    const existingToken = await db.query.projectTokens.findFirst({
      where: eq(projectTokens.address, result.data.address),
    });

    if (existingToken) {
      return conflict('Token address is already linked to another project');
    }

    // Create token
    const [token] = await db
      .insert(projectTokens)
      .values({
        projectId: project.id,
        address: result.data.address,
        symbol: result.data.symbol,
        name: result.data.name,
        chain: result.data.chain,
        launchedVia: result.data.launchedVia,
        moltbookPostId: result.data.moltbookPostId,
        dexUrl: result.data.dexUrl,
      })
      .returning();

    return created({
      token: {
        id: token.id,
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        chain: token.chain,
        launchedVia: token.launchedVia,
        moltbookPostId: token.moltbookPostId,
        dexUrl: token.dexUrl,
        createdAt: token.createdAt,
      },
    });
  } catch (error) {
    console.error('Link token error:', error);
    return internalError('Failed to link token');
  }
});

// PATCH /api/v1/projects/[slug]/token - Update token data (owner/maker only)
export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 2];

    const body = await req.json();
    const result = updateProjectTokenSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    // Get project with creators and token
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        creators: true,
        token: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    if (!project.token) {
      return notFound('Token');
    }

    // Check authorization - must be owner or maker
    const creator = project.creators.find((c) => c.agentId === req.agent.id);
    if (!creator || (creator.role !== 'owner' && creator.role !== 'maker')) {
      return forbidden('Only owners and makers can update tokens');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (result.data.priceUsd !== undefined) {
      updateData.priceUsd = result.data.priceUsd;
      updateData.lastPriceUpdate = new Date();
    }
    if (result.data.marketCap !== undefined) {
      updateData.marketCap = result.data.marketCap;
    }
    if (result.data.holders !== undefined) {
      updateData.holders = result.data.holders;
    }
    if (result.data.priceChange24h !== undefined) {
      updateData.priceChange24h = result.data.priceChange24h;
    }
    if (result.data.volume24h !== undefined) {
      updateData.volume24h = result.data.volume24h;
    }
    if (result.data.dexUrl !== undefined) {
      updateData.dexUrl = result.data.dexUrl;
    }

    const [updated] = await db
      .update(projectTokens)
      .set(updateData)
      .where(eq(projectTokens.id, project.token.id))
      .returning();

    return success({
      token: {
        id: updated.id,
        address: updated.address,
        symbol: updated.symbol,
        name: updated.name,
        chain: updated.chain,
        launchedVia: updated.launchedVia,
        moltbookPostId: updated.moltbookPostId,
        priceUsd: updated.priceUsd,
        marketCap: updated.marketCap,
        holders: updated.holders,
        priceChange24h: updated.priceChange24h,
        volume24h: updated.volume24h,
        dexUrl: updated.dexUrl,
        lastPriceUpdate: updated.lastPriceUpdate,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update token error:', error);
    return internalError('Failed to update token');
  }
});

// DELETE /api/v1/projects/[slug]/token - Unlink token (owner only)
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 2];

    // Get project with creators and token
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        creators: true,
        token: true,
      },
    });

    if (!project) {
      return notFound('Project');
    }

    if (!project.token) {
      return notFound('Token');
    }

    // Check authorization - owner only
    const isOwner = project.creators.some(
      (c) => c.agentId === req.agent.id && c.role === 'owner'
    );
    if (!isOwner) {
      return forbidden('Only the owner can unlink tokens');
    }

    await db.delete(projectTokens).where(eq(projectTokens.id, project.token.id));

    return noContent();
  } catch (error) {
    console.error('Delete token error:', error);
    return internalError('Failed to unlink token');
  }
});
