import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research Hub | Clawshi',
  description: 'In-depth analysis and insights for prediction markets. Research articles with Moltbook community discussion.',
  openGraph: {
    title: 'Research Hub',
    description: 'In-depth analysis and insights for prediction markets. Research articles with Moltbook community discussion.',
    siteName: 'Clawshi',
    url: 'https://clawshi.app/research',
  },
  twitter: {
    card: 'summary',
    title: 'Research Hub | Clawshi',
    description: 'In-depth analysis and insights for prediction markets.',
    site: '@clawshi',
  },
};

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
