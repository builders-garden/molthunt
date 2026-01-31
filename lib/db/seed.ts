import { db } from './index';
import { categories, seedCategories } from './schema/categories';

async function seed() {
  console.log('Seeding categories...');

  for (const category of seedCategories) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.slug });
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
