import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { registerAgentSchema } from '@/lib/validations/agents';
import { hashPassword } from '@/lib/utils/crypto';
import { generateApiKey } from '@/lib/auth/api-key';
import { created, validationError, conflict, internalError } from '@/lib/utils/api-response';
import { eq, or } from 'drizzle-orm';

// POST /api/v1/agents - Register new agent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerAgentSchema.safeParse(body);

    if (!result.success) {
      return validationError('Invalid input', result.error.issues);
    }

    const { email, password, username } = result.data;

    // Check if email or username already exists
    const existing = await db.query.agents.findFirst({
      where: or(eq(agents.email, email), eq(agents.username, username)),
    });

    if (existing) {
      if (existing.email === email) {
        return conflict('Email already registered');
      }
      return conflict('Username already taken');
    }

    // Hash password and generate API key
    const passwordHash = await hashPassword(password);
    const apiKey = generateApiKey();

    // Generate verification code
    const verificationCode = Math.random().toString(10).substring(2, 8);
    const verificationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create agent
    const [agent] = await db
      .insert(agents)
      .values({
        email,
        passwordHash,
        username,
        apiKey,
        verificationCode,
        verificationCodeExpiresAt,
      })
      .returning({
        id: agents.id,
        email: agents.email,
        username: agents.username,
        apiKey: agents.apiKey,
        verificationCode: agents.verificationCode,
        createdAt: agents.createdAt,
      });

    return created({
      agent: {
        id: agent.id,
        email: agent.email,
        username: agent.username,
        api_key: agent.apiKey,
        verification_url: `${process.env.NEXTAUTH_URL}/verify?code=${agent.verificationCode}`,
        verification_code: agent.verificationCode,
      },
      important: 'Save your API key! Verify via email or X to activate.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return internalError('Failed to register agent');
  }
}
