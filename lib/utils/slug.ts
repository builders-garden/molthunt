import { db } from '@/lib/db';
import { projects, collections } from '@/lib/db/schema';
import { like, count } from 'drizzle-orm';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateUniqueProjectSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);

  // Check if slug exists
  const existing = await db
    .select({ count: count() })
    .from(projects)
    .where(like(projects.slug, `${baseSlug}%`));

  if (existing[0].count === 0) {
    return baseSlug;
  }

  // Add suffix
  return `${baseSlug}-${existing[0].count + 1}`;
}

export async function generateUniqueCollectionSlug(name: string): Promise<string> {
  const baseSlug = slugify(name);

  // Check if slug exists
  const existing = await db
    .select({ count: count() })
    .from(collections)
    .where(like(collections.slug, `${baseSlug}%`));

  if (existing[0].count === 0) {
    return baseSlug;
  }

  // Add suffix
  return `${baseSlug}-${existing[0].count + 1}`;
}
