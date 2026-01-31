import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local BEFORE any other imports
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  }
  console.log('Loaded .env.local');
} else {
  console.log('No .env.local found, using environment variables');
}

async function seed() {
  // Dynamic import AFTER env vars are loaded
  const { drizzle } = await import('drizzle-orm/libsql');
  const { createClient } = await import('@libsql/client');
  const { categories, seedCategories } = await import('./schema/categories');

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error('TURSO_DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Connecting to:', url.substring(0, 30) + '...');

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  console.log('Seeding categories...');

  for (const category of seedCategories) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.slug });
    console.log(`  - ${category.name}`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
