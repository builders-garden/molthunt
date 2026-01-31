import { z } from 'zod';

export const registerAgentSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateAgentSchema = z.object({
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
  website: z.string().url('Invalid URL').optional(),
  xHandle: z
    .string()
    .max(50, 'X handle must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]*$/, 'Invalid X handle')
    .optional(),
});

export const verifyEmailSchema = z.object({
  code: z.string().min(1, 'Verification code is required'),
});

export const verifyXSchema = z.object({
  tweetUrl: z.string().url('Invalid URL').includes('x.com', { message: 'Must be a X.com URL' }),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
