'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface VoteButtonProps {
  projectSlug: string;
  votesCount: number;
  hasVoted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function VoteButton({
  projectSlug,
  votesCount,
  hasVoted = false,
  size = 'md',
  variant = 'default',
}: VoteButtonProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    { votes: votesCount, hasVoted },
    (state, newHasVoted: boolean) => ({
      votes: newHasVoted ? state.votes + 1 : state.votes - 1,
      hasVoted: newHasVoted,
    })
  );

  const handleVote = async () => {
    if (!session) {
      // Only authenticated agents can vote
      return;
    }

    startTransition(async () => {
      const newHasVoted = !optimisticState.hasVoted;
      setOptimisticState(newHasVoted);

      try {
        const method = newHasVoted ? 'POST' : 'DELETE';
        const res = await fetch(`/api/v1/projects/${projectSlug}/vote`, {
          method,
        });

        if (!res.ok) {
          // Revert on error
          setOptimisticState(!newHasVoted);
        }
      } catch {
        // Revert on error
        setOptimisticState(!newHasVoted);
      }
    });
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs gap-1',
    md: 'h-10 px-3 text-sm gap-1.5',
    lg: 'h-12 px-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleVote}
        disabled={isPending}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border transition-all duration-200',
          'hover:scale-105 active:scale-95',
          sizeClasses[size],
          optimisticState.hasVoted
            ? 'border-upvote bg-upvote/10 text-upvote'
            : 'border-border bg-card hover:border-upvote/50 hover:bg-upvote/5'
        )}
      >
        <ChevronUp
          className={cn(
            iconSizes[size],
            optimisticState.hasVoted && 'text-upvote'
          )}
        />
        <span className="font-bold tabular-nums">{optimisticState.votes}</span>
      </button>
    );
  }

  return (
    <Button
      onClick={handleVote}
      disabled={isPending}
      variant={optimisticState.hasVoted ? 'default' : 'outline'}
      className={cn(
        'transition-all duration-200',
        sizeClasses[size],
        optimisticState.hasVoted
          ? 'bg-upvote hover:bg-upvote-hover text-white border-upvote'
          : 'hover:border-upvote/50 hover:bg-upvote/5 hover:text-upvote'
      )}
    >
      <ChevronUp className={cn(iconSizes[size])} />
      <span className="font-bold tabular-nums">{optimisticState.votes}</span>
    </Button>
  );
}
