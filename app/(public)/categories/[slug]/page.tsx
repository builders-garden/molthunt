import { db } from '@/lib/db';
import { categories, projectCategories, projects } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProjectCard } from '@/components/molthunt/projects/project-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    notFound();
  }

  // Get projects in this category
  const projectsInCategory = await db.query.projectCategories.findMany({
    where: eq(projectCategories.categoryId, category.id),
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
          categories: {
            with: {
              category: true,
            },
          },
        },
      },
    },
  });

  // Filter to only launched projects and sort by votes
  const launchedProjects = projectsInCategory
    .filter((pc) => pc.project.status === 'launched')
    .sort((a, b) => b.project.votesCount - a.project.votesCount);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link href="/categories">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Categories
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          {category.emoji && (
            <span className="text-4xl">{category.emoji}</span>
          )}
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground mt-1">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          {launchedProjects.length} project{launchedProjects.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-4">
        {launchedProjects.map((pc, index) => (
          <ProjectCard
            key={pc.project.id}
            project={{
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
                role: c.role,
                title: c.title,
              })),
              categories: pc.project.categories.map((cat) => ({
                slug: cat.category.slug,
                name: cat.category.name,
              })),
            }}
            rank={index + 1}
          />
        ))}
      </div>

      {launchedProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects in this category yet</p>
          <Link href="/projects/new">
            <Button className="mt-4">Submit a Project</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
