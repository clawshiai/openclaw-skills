'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Research, MoltbookComment, getResearch, getResearchComments } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  User,
} from 'lucide-react';

const categoryColors: Record<string, string> = {
  crypto: 'bg-orange-600/20 text-orange-400',
  ai_agi: 'bg-purple-600/20 text-purple-400',
  geopolitics: 'bg-red-600/20 text-red-400',
  tech: 'bg-blue-600/20 text-blue-400',
  moltbook: 'bg-teal-600/20 text-teal-400',
  economics: 'bg-green-600/20 text-green-400',
};

export default function ResearchDetailClient() {
  const params = useParams();
  const { t } = useLanguage();
  const [article, setArticle] = useState<Research | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<MoltbookComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const data = await getResearch(Number(params.id));
        setArticle(data);
        setComments(data.comments || []);
      } catch (err) {
        setError('Failed to load research');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchArticle();
  }, [params.id]);

  async function refreshComments() {
    if (!article) return;
    setCommentsLoading(true);
    try {
      const data = await getResearchComments(article.id);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  }

  const date = article
    ? new Date(article.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) + ' · ' + new Date(article.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-border rounded w-32" />
            <div className="h-8 bg-border rounded w-3/4" />
            <div className="h-4 bg-border rounded w-1/2" />
            <div className="h-64 bg-border rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-muted-foreground">{error || 'Research not found'}</p>
          <Link href="/research" className="text-teal-400 hover:underline mt-4 inline-block">
            {t('research.backToResearch')}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/research"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          {t('research.backToResearch')}
        </Link>

        {/* Article header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {article.category && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  categoryColors[article.category] || 'bg-teal-600/20 text-teal-400'
                }`}
              >
                {t(`research.category.${article.category}`)}
              </span>
            )}
            <span className="text-xs text-subtle flex items-center gap-1">
              <Calendar size={12} />
              {date}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{article.title}</h1>

          {article.summary && (
            <p className="text-lg text-muted-foreground">{article.summary}</p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-surface-hover border border-border-hover rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article content */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-8">
          <div className="max-w-none text-sm leading-relaxed text-foreground
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground
            [&_p]:mb-3 [&_p]:text-muted-foreground
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-muted-foreground
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-muted-foreground
            [&_li]:mb-1
            [&_a]:text-teal-400 [&_a]:underline
            [&_blockquote]:border-l-2 [&_blockquote]:border-teal-600/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
            [&_code]:bg-surface-hover [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:text-teal-400
            [&_table]:w-full [&_table]:mb-4 [&_table]:text-xs
            [&_thead]:border-b [&_thead]:border-border
            [&_th]:text-left [&_th]:py-2 [&_th]:px-3 [&_th]:font-semibold [&_th]:text-foreground
            [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-border/50 [&_td]:text-muted-foreground
            [&_hr]:border-border [&_hr]:my-6
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Suggested markets */}
        {article.suggested_markets && article.suggested_markets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('research.suggestedMarkets')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.suggested_markets.map((market) => (
                <Link key={market.id} href={`/market/${market.id}`}>
                  <div className="bg-surface border border-border rounded-xl p-4 hover:border-teal-600/50 transition-all">
                    <p className="text-sm font-medium line-clamp-2 mb-2">{market.question}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 bg-border rounded-full overflow-hidden flex">
                          <div
                            className="bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
                            style={{ width: `${market.probabilities.yes}%` }}
                          />
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                            style={{ width: `${market.probabilities.no}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-green-500 font-medium">
                        {market.probabilities.yes}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Moltbook comments */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare size={18} />
              {t('research.communityDiscussion')}
              {comments.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({comments.length})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {article.moltbook_post_id && (
                <a
                  href={`https://www.moltbook.com/post/${article.moltbook_post_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-400 hover:underline flex items-center gap-1"
                >
                  {t('research.viewOnMoltbook')}
                  <ExternalLink size={12} />
                </a>
              )}
              <button
                onClick={refreshComments}
                disabled={commentsLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-surface-hover border border-border-hover rounded-lg text-muted hover:text-foreground hover:border-teal-600/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={commentsLoading ? 'animate-spin' : ''} />
                {t('research.refreshComments')}
              </button>
            </div>
          </div>

          {commentsLoading && comments.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-border rounded w-24 mb-2" />
                  <div className="h-4 bg-border rounded w-full mb-1" />
                  <div className="h-4 bg-border rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-8 text-center">
              <MessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t('research.noComments')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      {comment.author.karma > 0 && (
                        <span className="text-xs text-subtle">
                          {comment.author.karma} karma
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-subtle">
                      {comment.upvotes > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} />
                          {comment.upvotes}
                        </span>
                      )}
                      <span>
                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
