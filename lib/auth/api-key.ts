import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function validateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('mh_')) {
    return null;
  }

  const agent = await db.query.agents.findFirst({
    where: eq(agents.apiKey, apiKey),
    columns: {
      id: true,
      email: true,
      username: true,
      emailVerified: true,
      isAdmin: true,
    },
  });

  return agent;
}

export function generateApiKey(): string {
  // Generate a 32-character random string prefixed with mh_
  return `mh_${nanoid(32)}`;
}
