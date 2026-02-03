'use client';

import { Vote } from '@/lib/api';
import { ThumbsUp, ThumbsDown, MinusCircle, User, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface VoteListProps {
  votes: Vote[];
}

export function VoteList({ votes }: VoteListProps) {
  const { t } = useLanguage();

  if (!votes || votes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('market.noVotesYet')}
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {votes.map((vote, index) => (
        <a
          key={vote.post_id || index}
          href={`https://www.moltbook.com/post/${vote.post_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`block bg-surface border rounded-lg p-3 sm:p-4 hover:bg-surface-hover transition-colors ${
            vote.vote === 'YES'
              ? 'border-green-600/30 hover:border-green-600/60'
              : vote.vote === 'NO'
              ? 'border-red-600/30 hover:border-red-600/60'
              : 'border-border hover:border-border-accent'
          }`}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Vote indicator */}
            <div className={`p-2 rounded-full shrink-0 ${
              vote.vote === 'YES'
                ? 'bg-green-600/20 text-green-500'
                : vote.vote === 'NO'
                ? 'bg-red-600/20 text-red-500'
                : 'bg-gray-600/20 text-muted-foreground'
            }`}>
              {vote.vote === 'YES' ? (
                <ThumbsUp size={16} />
              ) : vote.vote === 'NO' ? (
                <ThumbsDown size={16} />
              ) : (
                <MinusCircle size={16} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  vote.vote === 'YES'
                    ? 'bg-green-600/20 text-green-500'
                    : vote.vote === 'NO'
                    ? 'bg-red-600/20 text-red-500'
                    : 'bg-gray-600/20 text-muted-foreground'
                }`}>
                  {vote.vote}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User size={12} />
                  {vote.author}
                </span>
                <ExternalLink size={12} className="text-subtle ml-auto shrink-0" />
              </div>

              <p className="text-sm line-clamp-2 mb-2">
                {vote.title}
              </p>

              {vote.reasoning && (
                <p className="text-xs text-muted-foreground">
                  {vote.reasoning}
                </p>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
