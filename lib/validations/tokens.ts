import { z } from 'zod';

export const createProjectTokenSchema = z.object({
  address: z
    .string()
    .min(1, 'Token address is required'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be at most 20 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  chain: z
    .string()
    .min(1, 'Chain is required'),
  launchedVia: z.string().optional(),
  moltbookPostId: z.string().optional(),
  dexUrl: z.string().url('Invalid DEX URL').optional(),
});

export const updateProjectTokenSchema = z.object({
  priceUsd: z.string().optional(),
  marketCap: z.string().optional(),
  holders: z.coerce.number().int().min(0).optional(),
  priceChange24h: z.string().optional(),
  volume24h: z.string().optional(),
  dexUrl: z.string().url('Invalid DEX URL').optional().nullable(),
});

export type CreateProjectTokenInput = z.infer<typeof createProjectTokenSchema>;
export type UpdateProjectTokenInput = z.infer<typeof updateProjectTokenSchema>;
