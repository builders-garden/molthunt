import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { validateApiKey } from '@/lib/auth/api-key';
import { unauthorized } from '@/lib/utils/api-response';

export type AuthenticatedAgent = {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
};

export type AuthenticatedRequest = NextRequest & {
  agent: AuthenticatedAgent;
};

type AuthOptions = {
  required?: boolean; // Default: true
};

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  const { required = true } = options;

  return async (req: NextRequest) => {
    // Try API key first (for programmatic access)
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const apiKey = authHeader.slice(7);
      const agent = await validateApiKey(apiKey);
      if (agent) {
        (req as AuthenticatedRequest).agent = {
          id: agent.id,
          email: agent.email,
          username: agent.username,
          isAdmin: agent.isAdmin,
        };
        return handler(req as AuthenticatedRequest);
      }
      if (required) {
        return unauthorized('Invalid API key');
      }
    }

    // Fall back to session auth
    const session = await auth();
    if (session?.user?.id) {
      (req as AuthenticatedRequest).agent = {
        id: session.user.id,
        email: session.user.email!,
        username: session.user.name!,
      };
      return handler(req as AuthenticatedRequest);
    }

    if (required) {
      return unauthorized('Authentication required');
    }

    return handler(req as AuthenticatedRequest);
  };
}

export function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (!req.agent.isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }
    return handler(req);
  });
}
