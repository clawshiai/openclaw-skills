'use client';

import Link from 'next/link';
import { Research } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { MessageSquare, Calendar } from 'lucide-react';

const categoryColors: Record<string, string> = {
  crypto: 'bg-orange-600/20 text-orange-400',
  ai_agi: 'bg-purple-600/20 text-purple-400',
  geopolitics: 'bg-red-600/20 text-red-400',
  tech: 'bg-blue-600/20 text-blue-400',
  moltbook: 'bg-teal-600/20 text-teal-400',
  economics: 'bg-green-600/20 text-green-400',
};

export function ResearchCard({ article }: { article: Research }) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  const date = new Date(article.created_at).toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' · ' + new Date(article.created_at).toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link href={`/research/${article.id}`}>
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 hover:border-teal-600/50 transition-all duration-300 cursor-pointer group">
        {/* Category badge */}
        {article.category && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              categoryColors[article.category] || 'bg-teal-600/20 text-teal-400'
            }`}
          >
            {t(`research.category.${article.category}`)}
          </span>
        )}

        {/* Title */}
        <h3 className="text-foreground font-semibold mt-2 mb-1 line-clamp-2 group-hover:text-teal-400 transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {article.summary}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-1.5 py-0.5 bg-surface-hover border border-border-hover rounded text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {date}
          </span>
          {article.moltbook_post_id && (
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {t('research.comments')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
