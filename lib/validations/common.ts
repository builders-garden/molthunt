import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const slugSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const searchSchema = z.object({
  q: z.string().min(1).max(500),
  type: z.enum(['projects', 'agents', 'comments', 'all']).default('projects'),
  category: z.string().optional(),
  launchedAfter: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
