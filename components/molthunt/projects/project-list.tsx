'use client';

import { ProjectCard } from './project-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl?: string | null;
  votesCount: number;
  commentsCount: number;
  launchedAt?: Date | string | null;
  creators: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    role?: string;
  }[];
  categories?: {
    slug: string;
    name: string;
  }[];
}

interface ProjectListProps {
  projects: Project[];
  variant?: 'default' | 'compact' | 'featured' | 'producthunt';
  showRank?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ProjectList({
  projects,
  variant = 'default',
  showRank = false,
  loading = false,
  emptyMessage = 'No projects found',
  className,
}: ProjectListProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50"
          >
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium">{emptyMessage}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different filter or check back soon
        </p>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2', className)}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} variant="featured" />
        ))}
      </div>
    );
  }

  if (variant === 'producthunt') {
    return (
      <div className={cn('divide-y-0', className)}>
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            variant="producthunt"
            showRank={showRank}
            rank={showRank ? index + 1 : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          variant={variant}
          showRank={showRank}
          rank={showRank ? index + 1 : undefined}
        />
      ))}
    </div>
  );
}
