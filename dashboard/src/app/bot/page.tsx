'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';
import {
  MessageSquare,
  TrendingUp,
  BarChart3,
  Trophy,
  Activity,
  FileText,
  Clock,
  Wallet,
  CircleDollarSign,
  Gift,
} from 'lucide-react';
import { FaTelegram } from 'react-icons/fa';

export default function BotPage() {
  const { t } = useLanguage();

  const commands = [
    { cmd: '/start', desc: t('bot.commands.start'), icon: MessageSquare },
    { cmd: '/markets', desc: t('bot.commands.markets'), icon: BarChart3 },
    { cmd: '/market <id>', desc: t('bot.commands.market'), icon: FileText },
    { cmd: '/signals', desc: t('bot.commands.signals'), icon: TrendingUp },
    { cmd: '/trends', desc: t('bot.commands.trends'), icon: Activity },
    { cmd: '/leaderboard', desc: t('bot.commands.leaderboard'), icon: Trophy },
    { cmd: '/stats', desc: t('bot.commands.stats'), icon: BarChart3 },
    { cmd: '/contract', desc: t('bot.commands.contract'), icon: FileText },
  ];

  const comingSoon = [
    { cmd: '/bet', desc: t('bot.coming.bet'), icon: CircleDollarSign },
    { cmd: '/wallet', desc: t('bot.coming.wallet'), icon: Wallet },
    { cmd: '/mystakes', desc: t('bot.coming.mystakes'), icon: BarChart3 },
    { cmd: '/claim', desc: t('bot.coming.claim'), icon: Gift },
  ];

  const steps = [
    t('bot.quickstart.step1'),
    t('bot.quickstart.step2'),
    t('bot.quickstart.step3'),
    t('bot.quickstart.step4'),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Image
            src="/logo.png"
            alt="Clawshi"
            width={100}
            height={100}
            className="mx-auto mb-6 rounded-xl animate-float"
          />
          <h1 className="text-3xl sm:text-4xl font-bold font-heading mb-3">
            {t('bot.hero.title')}
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            {t('bot.hero.subtitle')}
          </p>
          <a
            href="https://t.me/ClawshiBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <FaTelegram size={20} />
            {t('bot.hero.cta')}
          </a>
        </div>

        {/* Available Commands */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
            <FaTelegram size={20} className="text-teal-400" />
            {t('bot.commands.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commands.map((c) => (
              <div
                key={c.cmd}
                className="flex items-start gap-3 p-4 bg-surface-hover border border-border-hover rounded-lg"
              >
                <c.icon size={18} className="text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <code className="text-sm font-mono text-foreground">{c.cmd}</code>
                  <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
            <Clock size={20} className="text-yellow-400" />
            {t('bot.coming.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {comingSoon.map((c) => (
              <div
                key={c.cmd}
                className="flex items-start gap-3 p-4 bg-yellow-600/5 border border-yellow-600/20 rounded-lg opacity-70"
              >
                <c.icon size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <code className="text-sm font-mono text-foreground">{c.cmd}</code>
                  <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            USDC staking on Base coming in the next update.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
            <MessageSquare size={20} className="text-teal-400" />
            {t('bot.quickstart.title')}
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 pt-1">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <a
              href="https://t.me/ClawshiBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
            >
              <FaTelegram size={16} />
              Open @ClawshiBot
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
