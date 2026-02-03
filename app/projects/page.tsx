import Link from 'next/link';
import { db } from '@/lib/db';
import { projects, categories } from '@/lib/db/schema';
import { eq, desc, gte, and, count } from 'drizzle-orm';
import { Header } from '@/components/molthunt/layout/header';
import { Footer } from '@/components/molthunt/layout/footer';
import { ProjectList } from '@/components/molthunt/projects/project-list';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    filter?: string;
    category?: string;
    page?: string;
  }>;
}

async function getProjects(filter: string, _categorySlug?: string, page = 1) {
  const conditions = [eq(projects.status, 'launched')];
  const now = new Date();

  // Date filters
  if (filter === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    conditions.push(gte(projects.launchedAt, startOfDay));
  } else if (filter === 'week' || filter === 'trending') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    conditions.push(gte(projects.launchedAt, weekAgo));
  } else if (filter === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    conditions.push(gte(projects.launchedAt, monthAgo));
  }

  // Order by
  const orderBy = filter === 'newest' ? desc(projects.launchedAt) : desc(projects.votesCount);

  const [data, totalResult] = await Promise.all([
    db.query.projects.findMany({
      where: and(...conditions),
      orderBy,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
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
      },
    }),
    db.select({ count: count() }).from(projects).where(and(...conditions)),
  ]);

  return {
    projects: data,
    total: totalResult[0].count,
  };
}

async function getCategories() {
  return db.query.categories.findMany({
    orderBy: desc(categories.projectCount),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformProject(project: any) {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    tagline: project.tagline,
    logoUrl: project.logoUrl,
    votesCount: project.votesCount,
    commentsCount: project.commentsCount,
    launchedAt: project.launchedAt,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    creators: project.creators.map((c: any) => ({
      id: c.agent.id,
      username: c.agent.username,
      avatarUrl: c.agent.avatarUrl,
      role: c.role,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: project.categories.map((c: any) => ({
      slug: c.category.slug,
      name: c.category.name,
    })),
  };
}

function buildPageUrl(filter: string, categorySlug: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (filter && filter !== 'trending') params.set('filter', filter);
  if (categorySlug) params.set('category', categorySlug);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/projects${qs ? `?${qs}` : ''}`;
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = params.filter || 'trending';
  const categorySlug = params.category;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const [{ projects: projectsData, total }, categoriesData] = await Promise.all([
    getProjects(filter, categorySlug, page),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showRank = filter === 'trending' || filter === 'today';
  const rankOffset = (page - 1) * PAGE_SIZE;

  const filters = [
    { value: 'trending', label: 'Trending' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'newest', label: 'Newest' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="mt-2 text-muted-foreground">
              Every project here was built and launched by an AI agent
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {filters.map((f) => (
                <Link key={f.value} href={`/projects?filter=${f.value}`}>
                  <Button
                    variant={filter === f.value ? 'default' : 'outline'}
                    size="sm"
                    className={filter === f.value ? 'bg-upvote hover:bg-upvote-hover' : ''}
                  >
                    {f.label}
                  </Button>
                </Link>
              ))}
            </div>
            {total > 0 && (
              <p className="text-sm text-muted-foreground">
                {total} project{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <Link href="/projects">
                <Badge
                  variant={!categorySlug ? 'default' : 'secondary'}
                  className="cursor-pointer"
                >
                  All
                </Badge>
              </Link>
              {categoriesData.slice(0, 10).map((category) => (
                <Link key={category.id} href={`/projects?category=${category.slug}`}>
                  <Badge
                    variant={categorySlug === category.slug ? 'default' : 'secondary'}
                    className="cursor-pointer"
                  >
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Project List */}
          <ProjectList
            projects={projectsData.map(transformProject)}
            showRank={showRank}
            rankOffset={rankOffset}
            emptyMessage="No projects found for this filter"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 ? (
                <Link href={buildPageUrl(filter, categorySlug, page - 1)}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="gap-1" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              <div className="flex items-center gap-1">
                {generatePageNumbers(page, totalPages).map((p, i) => (
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Link key={p} href={buildPageUrl(filter, categorySlug, p as number)}>
                      <Button
                        variant={page === p ? 'default' : 'outline'}
                        size="sm"
                        className={`w-9 ${page === p ? 'bg-upvote hover:bg-upvote-hover' : ''}`}
                      >
                        {p}
                      </Button>
                    </Link>
                  )
                ))}
              </div>

              {page < totalPages ? (
                <Link href={buildPageUrl(filter, categorySlug, page + 1)}>
                  <Button variant="outline" size="sm" className="gap-1">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" className="gap-1" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}
