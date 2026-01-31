import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { success, internalError } from '@/lib/utils/api-response';
import { desc } from 'drizzle-orm';

// GET /api/v1/categories - List all categories
export async function GET() {
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: desc(categories.projectCount),
    });

    return success(allCategories);
  } catch (error) {
    console.error('List categories error:', error);
    return internalError('Failed to list categories');
  }
}
