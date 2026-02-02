import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { VoteButton } from './vote-button';
import { MessageCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Creator {
  id: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
}

interface Category {
  slug: string;
  name: string;
}

interface ProjectCardProps {
  project: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    logoUrl?: string | null;
    votesCount: number;
    commentsCount: number;
    launchedAt?: Date | string | null;
    creators: Creator[];
    categories?: Category[];
  };
  variant?: 'default' | 'compact' | 'featured' | 'producthunt';
  hasVoted?: boolean;
  showRank?: boolean;
  rank?: number;
}

export function ProjectCard({
  project,
  variant = 'default',
  hasVoted = false,
  showRank = false,
  rank,
}: ProjectCardProps) {
  const mainCreator = project.creators[0];

  // Product Hunt style variant
  if (variant === 'producthunt') {
    return (
      <div className="group flex items-center gap-4 py-5 border-b border-border/40 last:border-b-0 cursor-pointer">
        <Link href={`/projects/${project.slug}`} className="flex-shrink-0">
          <Avatar className="h-14 w-14 rounded-xl shadow-sm">
            <AvatarImage src={project.logoUrl || ''} alt={project.name} />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-accent to-primary text-white text-lg font-semibold">
              {project.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <Link href={`/projects/${project.slug}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
            {showRank && rank && (
              <span className="text-muted-foreground mr-1">{rank}.</span>
            )}
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {project.tagline}
          </p>
          {project.categories && project.categories.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              {project.categories.slice(0, 3).map((category, i) => (
                <span key={category.slug} className="flex items-center">
                  {category.name}
                  {i < Math.min(project.categories!.length - 1, 2) && (
                    <span className="mx-1.5">·</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-center justify-center h-14 px-3 rounded-lg border border-border/50 bg-card hover:bg-muted/50 transition-colors">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium tabular-nums mt-0.5">{project.commentsCount}</span>
          </div>
          <VoteButton
            projectSlug={project.slug}
            votesCount={project.votesCount}
            hasVoted={hasVoted}
            size="lg"
            variant="compact"
          />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer">
        {showRank && rank && (
          <span className="text-2xl font-bold text-muted-foreground w-8">
            {rank}
          </span>
        )}

        <Link href={`/projects/${project.slug}`} className="flex-shrink-0">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={project.logoUrl || ''} alt={project.name} />
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-accent to-primary text-white">
              {project.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <Link href={`/projects/${project.slug}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{project.tagline}</p>
        </Link>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm tabular-nums">{project.commentsCount}</span>
          </div>
          <VoteButton
            projectSlug={project.slug}
            votesCount={project.votesCount}
            hasVoted={hasVoted}
            size="sm"
            variant="compact"
          />
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 hover:border-accent/50 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <Link href={`/projects/${project.slug}`} className="flex items-start gap-4">
              <Avatar className="h-16 w-16 rounded-xl">
                <AvatarImage src={project.logoUrl || ''} alt={project.name} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-accent to-primary text-white text-xl">
                  {project.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                <p className="mt-1 text-muted-foreground line-clamp-2">
                  {project.tagline}
                </p>

                {project.categories && project.categories.length > 0 && (
                  <div className="mt-3 hidden sm:flex flex-wrap gap-2">
                    {project.categories.map((category) => (
                      <Badge
                        key={category.slug}
                        variant="secondary"
                        className="text-xs"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>

            <VoteButton
              projectSlug={project.slug}
              votesCount={project.votesCount}
              hasVoted={hasVoted}
              size="lg"
              variant="compact"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {project.creators.slice(0, 3).map((creator, i) => (
                <Link
                  key={creator.id}
                  href={`/@${creator.username}`}
                  className={cn('relative', i > 0 && '-ml-2')}
                  style={{ zIndex: 3 - i }}
                >
                  <Avatar className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={creator.avatarUrl || ''} />
                    <AvatarFallback className="text-[10px]">
                      {creator.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ))}
              <span className="text-sm text-muted-foreground ml-1">
                by @{mainCreator.username}
                {project.creators.length > 1 && ` +${project.creators.length - 1}`}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm tabular-nums">{project.commentsCount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-200">
      {showRank && rank && (
        <span
          className={cn(
            'text-2xl font-bold w-8 text-center',
            rank === 1 && 'text-yellow-500',
            rank === 2 && 'text-gray-400',
            rank === 3 && 'text-amber-600',
            rank > 3 && 'text-muted-foreground'
          )}
        >
          {rank}
        </span>
      )}

      <Link href={`/projects/${project.slug}`} className="flex-shrink-0">
        <Avatar className="h-14 w-14 rounded-xl">
          <AvatarImage src={project.logoUrl || ''} alt={project.name} />
          <AvatarFallback className="rounded-xl bg-gradient-to-br from-accent to-primary text-white text-lg">
            {project.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <Link href={`/projects/${project.slug}`} className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
            {project.name}
          </h3>
          {project.categories && project.categories[0] && (
            <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
              {project.categories[0].name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {project.tagline}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={mainCreator.avatarUrl || ''} />
              <AvatarFallback className="text-[9px]">
                {mainCreator.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              @{mainCreator.username}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs tabular-nums">{project.commentsCount}</span>
          </div>
        </div>
      </Link>

      <VoteButton
        projectSlug={project.slug}
        votesCount={project.votesCount}
        hasVoted={hasVoted}
        size="md"
        variant="compact"
      />
    </div>
  );
}
