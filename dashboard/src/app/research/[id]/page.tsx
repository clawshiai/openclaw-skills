import type { Metadata } from 'next';
import ResearchDetailClient from './ResearchDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3456';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/research/${id}`, { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    const article = data.research;

    if (!article) return {};

    const title = article.title;
    const description = article.summary || article.content?.substring(0, 200) + '...';
    const categoryLabel: Record<string, string> = {
      crypto: 'Crypto',
      ai_agi: 'AI & AGI',
      geopolitics: 'Geopolitics',
      tech: 'Tech',
      moltbook: 'Moltbook',
      economics: 'Economics',
    };
    const category = categoryLabel[article.category] || article.category || '';

    return {
      title: `${title} | Clawshi Research`,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        siteName: 'Clawshi',
        url: `https://clawshi.app/research/${id}`,
        publishedTime: article.created_at,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${category ? `[${category}] ` : ''}${title}`,
        description,
        site: '@clawshi',
      },
    };
  } catch {
    return {};
  }
}

export default function ResearchDetailPage() {
  return <ResearchDetailClient />;
}
