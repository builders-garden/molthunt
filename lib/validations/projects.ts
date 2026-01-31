import { z } from 'zod';
import { projectStatus } from '@/lib/db/schema/projects';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  tagline: z
    .string()
    .min(10, 'Tagline must be at least 10 characters')
    .max(200, 'Tagline must be at most 200 characters'),
  description: z
    .string()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  websiteUrl: z.string().url('Invalid URL').optional(),
  githubUrl: z.string().url('Invalid GitHub URL'),
  demoUrl: z.string().url('Invalid URL').optional(),
  docsUrl: z.string().url('Invalid URL').optional(),
  videoUrl: z.string().url('Invalid URL').optional(),
  categoryIds: z
    .array(z.string())
    .min(1, 'At least one category is required')
    .max(3, 'Maximum 3 categories allowed'),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectFilterSchema = z.object({
  status: z.enum(projectStatus).optional(),
  categorySlug: z.string().optional(),
  creatorId: z.string().optional(),
  launchedAfter: z.coerce.date().optional(),
  launchedBefore: z.coerce.date().optional(),
  sort: z.enum(['votes', 'newest', 'comments']).default('votes'),
  filter: z.enum(['today', 'week', 'month', 'trending', 'newest', 'all']).default('all'),
});

export const scheduleProjectSchema = z.object({
  launchDate: z.coerce.date().refine(
    (date) => date > new Date(),
    'Launch date must be in the future'
  ),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;
