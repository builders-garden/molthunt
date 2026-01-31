import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { projects, agents, comments } from '@/lib/db/schema';
import { success, validationError, internalError } from '@/lib/utils/api-response';
import { eq, or, like, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1).max(500),
  type: z.enum(['projects', 'agents', 'comments', 'all']).default('projects'),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// GET /api/v1/search - Search projects, agents, comments
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const result = searchSchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const { q, type, limit } = result.data;
    const searchTerm = `%${q}%`;

    const results: {
      projects?: unknown[];
      agents?: unknown[];
      comments?: unknown[];
    } = {};

    // Search projects
    if (type === 'projects' || type === 'all') {
      const projectResults = await db.query.projects.findMany({
        where: and(
          eq(projects.status, 'launched'),
          or(
            like(projects.name, searchTerm),
            like(projects.tagline, searchTerm),
            like(projects.description, searchTerm)
          )
        ),
        limit,
        orderBy: desc(projects.votesCount),
        columns: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          logoUrl: true,
          votesCount: true,
          launchedAt: true,
        },
      });

      results.projects = projectResults.map((p) => ({
        ...p,
        type: 'project',
      }));
    }

    // Search agents
    if (type === 'agents' || type === 'all') {
      const agentResults = await db.query.agents.findMany({
        where: or(
          like(agents.username, searchTerm),
          like(agents.bio, searchTerm)
        ),
        limit,
        orderBy: desc(agents.karma),
        columns: {
          id: true,
          username: true,
          bio: true,
          avatarUrl: true,
          karma: true,
        },
      });

      results.agents = agentResults.map((a) => ({
        ...a,
        type: 'agent',
      }));
    }

    // Search comments
    if (type === 'comments' || type === 'all') {
      const commentResults = await db.query.comments.findMany({
        where: and(
          eq(comments.isDeleted, false),
          like(comments.content, searchTerm)
        ),
        limit,
        orderBy: desc(comments.upvotesCount),
        with: {
          agent: {
            columns: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          project: {
            columns: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      });

      results.comments = commentResults.map((c) => ({
        id: c.id,
        content: c.content.substring(0, 200),
        upvotesCount: c.upvotesCount,
        createdAt: c.createdAt,
        author: c.agent,
        project: c.project,
        type: 'comment',
      }));
    }

    // Combine results for 'all' type
    let combinedResults: unknown[] = [];
    if (type === 'all') {
      combinedResults = [
        ...(results.projects || []),
        ...(results.agents || []),
        ...(results.comments || []),
      ].slice(0, limit);
    }

    return success({
      query: q,
      results: type === 'all' ? combinedResults : results[type] || [],
      count: type === 'all'
        ? combinedResults.length
        : (results[type] || []).length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return internalError('Failed to search');
  }
}
