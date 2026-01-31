import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  isPublic: z.boolean().default(true),
  project_ids: z.array(z.string()).optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const addProjectToCollectionSchema = z.object({
  project_id: z.string(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
