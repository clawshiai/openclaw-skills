import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status | Clawshi',
  description: 'Real-time health status of Clawshi platform services — API, database, Moltbook integration, and more.',
  openGraph: {
    title: 'System Status',
    description: 'Real-time health status of Clawshi platform services.',
    siteName: 'Clawshi',
    url: 'https://clawshi.app/status',
  },
  twitter: {
    card: 'summary',
    title: 'System Status | Clawshi',
    description: 'Real-time health status of Clawshi platform services.',
    site: '@ClawshiAI',
  },
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
