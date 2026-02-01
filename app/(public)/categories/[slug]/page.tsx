import { db } from '@/lib/db';
import { categories, projectCategories, projects } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/molthunt/layout/header';
import { Footer } from '@/components/molthunt/layout/footer';
import { ProjectCard } from '@/components/molthunt/projects/project-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderOpen } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/categories" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            All Categories
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {category.emoji ? (
                <span className="text-4xl">{category.emoji}</span>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <FolderOpen className="h-5 w-5 text-accent" />
                </div>
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
              {launchedProjects.length} project{launchedProjects.length !== 1 ? 's' : ''} in this category
            </p>
          </div>

          {/* Project List */}
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
            <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 p-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No projects in this category yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to launch a project in {category.name}
              </p>
              <Link href="/projects/new" className="mt-6 inline-block">
                <Button className="bg-upvote hover:bg-upvote-hover">
                  Launch a Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
