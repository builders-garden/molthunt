import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const allCategories = await db.query.categories.findMany({
    orderBy: desc(categories.projectCount),
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p className="text-muted-foreground">
          Explore projects by category
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">No categories found</p>
        </div>
      )}
    </div>
  );
}
