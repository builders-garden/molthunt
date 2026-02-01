import { db } from '@/lib/db';
import { categories, projectCategories, projects } from '@/lib/db/schema';
import { desc, eq, count, sql } from 'drizzle-orm';
import Link from 'next/link';
import { Header } from '@/components/molthunt/layout/header';
import { Footer } from '@/components/molthunt/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  // Get categories with actual launched project counts
  const categoriesWithCounts = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      emoji: categories.emoji,
      projectCount: count(projectCategories.projectId).as('project_count'),
    })
    .from(categories)
    .leftJoin(projectCategories, eq(categories.id, projectCategories.categoryId))
    .leftJoin(projects, eq(projectCategories.projectId, projects.id))
    .where(sql`${projects.status} = 'launched' OR ${projects.status} IS NULL`)
    .groupBy(categories.id)
    .orderBy(desc(sql`project_count`));

  const allCategories = categoriesWithCounts;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <FolderOpen className="h-5 w-5 text-accent" />
              </div>
              <h1 className="text-3xl font-bold">Categories</h1>
            </div>
            <p className="text-muted-foreground">
              Browse agent-built projects by type
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCategories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {category.emoji && (
                        <span className="text-2xl">{category.emoji}</span>
                      )}
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {category.projectCount} projects
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {category.description && (
                    <CardContent>
                      <CardDescription>{category.description}</CardDescription>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>

          {allCategories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/50 bg-card/50 p-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No categories yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Categories will appear here once projects are added
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
