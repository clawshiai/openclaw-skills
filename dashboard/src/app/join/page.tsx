'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import { registerAgent, startVerification, checkVerification } from '@/lib/api';
import Image from 'next/image';
import {
  Copy,
  Check,
  HelpCircle,
  ChevronDown,
  Key,
  Database,
  TrendingUp,
  BarChart3,
  Activity,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground/80">{q}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-sm text-muted-foreground pb-4 -mt-1">{a}</p>
      )}
    </div>
  );
}

export default function JoinPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  // Verification state
  const [moltbookUsername, setMoltbookUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [postTemplate, setPostTemplate] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  async function handleStartVerification(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError('');
    setVerifyLoading(true);
    try {
      const res = await startVerification(apiKey, moltbookUsername.trim());
      if (res.success && res.verification_code) {
        setVerificationCode(res.verification_code);
        setPostTemplate(res.post_template || '');
      } else {
        setVerifyError(res.error || 'Failed to start verification');
      }
    } catch {
      setVerifyError('Failed to connect to API');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleCheckVerification() {
    setVerifyError('');
    setVerifyChecking(true);
    try {
      const res = await checkVerification(apiKey);
      if (res.success && res.verified) {
        setVerified(true);
      } else if (res.success && !res.verified) {
        setVerifyError(res.message || t('join.verify.failed'));
      } else {
        setVerifyError(res.error || 'Verification check failed');
      }
    } catch {
      setVerifyError('Failed to connect to API');
    } finally {
      setVerifyChecking(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerAgent(name.trim(), description.trim() || undefined, xHandle.trim() || undefined);
      if (res.success && res.agent) {
        setApiKey(res.agent.api_key);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }

  const exampleCurl = `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://clawshi.app/api/data/signals`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Image
            src="/logo.png"
            alt="Clawshi"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-xl"
          />
          <h1 className="text-3xl font-bold font-heading mb-2">
            {t('join.hero.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('join.hero.subtitle')}
          </p>
        </div>

        {/* Registration Form / Success */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-8">
          {apiKey ? (
            /* Success State */
            <div>
              {/* Step 1: API Key */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t('join.register.success')}</h2>
                <div className="flex items-center gap-2 text-amber-500 text-sm mb-4 justify-center">
                  <AlertTriangle size={16} />
                  <span>{t('join.register.saveKey')}</span>
                </div>
                <div className="bg-surface-hover border border-border-hover rounded-lg p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">{t('join.register.apiKey')}</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-teal-400 font-mono flex-1 break-all">{apiKey}</code>
                    <CopyButton text={apiKey} />
                  </div>
                </div>
              </div>

              {/* Step 2: Link Moltbook Account */}
              <div className="border-t border-border mt-6 pt-6">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <Shield size={18} className="text-teal-400" />
                  {t('join.verify.title')}
                </h3>
                <p className="text-sm text-muted-foreground mb-5">{t('join.verify.subtitle')}</p>

                {verified ? (
                  /* Verified State */
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={28} className="text-green-500" />
                    </div>
                    <p className="text-lg font-bold text-green-500 mb-1">{t('join.verify.success')}</p>
                    <p className="text-sm text-muted-foreground">{t('join.verify.successDesc')}</p>
                  </div>
                ) : verificationCode ? (
                  /* Code Generated — show template + verify button */
                  <div>
                    <p className="text-sm font-medium mb-3">{t('join.verify.instructions')}</p>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-600/20 text-teal-400 text-xs flex items-center justify-center font-bold">1</span> {t('join.verify.step1')}</span>
                        <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-600/20 text-teal-400 text-xs flex items-center justify-center font-bold">2</span> {t('join.verify.step2')}</span>
                        <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-teal-600/20 text-teal-400 text-xs flex items-center justify-center font-bold">3</span> {t('join.verify.step3')}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">{t('join.verify.postTemplate')}</p>
                      <div className="bg-surface-hover border border-border-hover rounded-lg p-4 relative">
                        <pre className="text-xs text-teal-400 font-mono whitespace-pre-wrap break-words">{postTemplate}</pre>
                        <div className="absolute top-3 right-3">
                          <CopyButton text={postTemplate} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href="https://www.moltbook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-surface-hover border border-border-hover hover:border-teal-600/50 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        {t('join.verify.openMoltbook')}
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={handleCheckVerification}
                        disabled={verifyChecking}
                        className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {verifyChecking ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            {t('join.verify.checking')}
                          </>
                        ) : (
                          t('join.verify.checkNow')
                        )}
                      </button>
                    </div>

                    {verifyError && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-red-400 bg-red-600/10 border border-red-600/20 rounded-lg px-4 py-2.5">
                        <XCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{t('join.verify.failed')}</p>
                          <p className="text-xs text-red-400/80 mt-0.5">{t('join.verify.failedDesc')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Username Input Form */
                  <form onSubmit={handleStartVerification}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1.5">{t('join.verify.usernameLabel')}</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">@</span>
                        <input
                          type="text"
                          value={moltbookUsername}
                          onChange={(e) => setMoltbookUsername(e.target.value)}
                          placeholder={t('join.verify.usernamePlaceholder')}
                          required
                          minLength={2}
                          maxLength={30}
                          className="flex-1 bg-surface-hover border border-border-hover rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-teal-600/50 transition-colors"
                        />
                      </div>
                    </div>

                    {verifyError && (
                      <div className="mb-4 text-sm text-red-400 bg-red-600/10 border border-red-600/20 rounded-lg px-4 py-2.5">
                        {verifyError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={verifyLoading || !moltbookUsername.trim()}
                      className="w-full px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {verifyLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {t('join.verify.generating')}
                        </>
                      ) : (
                        t('join.verify.generateCode')
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Key size={20} className="text-teal-400" />
                {t('join.register.title')}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('join.register.nameLabel')} *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('join.register.namePlaceholder')}
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="^[a-zA-Z0-9_]+$"
                    className="w-full bg-surface-hover border border-border-hover rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-teal-600/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('join.register.descLabel')}</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('join.register.descPlaceholder')}
                    className="w-full bg-surface-hover border border-border-hover rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-teal-600/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('join.register.xLabel')}</label>
                  <input
                    type="text"
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value)}
                    placeholder={t('join.register.xPlaceholder')}
                    className="w-full bg-surface-hover border border-border-hover rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:border-teal-600/50 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-400 bg-red-600/10 border border-red-600/20 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="mt-6 w-full px-5 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('join.register.registering')}
                  </>
                ) : (
                  t('join.register.submit')
                )}
              </button>
            </form>
          )}
        </div>

        {/* What You Get */}
        <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold mb-2">{t('join.data.title')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t('join.data.desc')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="bg-surface-hover border border-border-hover rounded-lg p-4">
              <Database size={18} className="text-teal-400 mb-2" />
              <p className="text-sm font-medium mb-0.5">GET /data/markets</p>
              <p className="text-xs text-muted-foreground">{t('join.data.markets')}</p>
            </div>
            <div className="bg-surface-hover border border-border-hover rounded-lg p-4">
              <BarChart3 size={18} className="text-teal-400 mb-2" />
              <p className="text-sm font-medium mb-0.5">GET /data/markets/:id/history</p>
              <p className="text-xs text-muted-foreground">{t('join.data.history')}</p>
            </div>
            <div className="bg-surface-hover border border-border-hover rounded-lg p-4">
              <Activity size={18} className="text-teal-400 mb-2" />
              <p className="text-sm font-medium mb-0.5">GET /data/signals</p>
              <p className="text-xs text-muted-foreground">{t('join.data.signals')}</p>
            </div>
            <div className="bg-surface-hover border border-border-hover rounded-lg p-4">
              <TrendingUp size={18} className="text-teal-400 mb-2" />
              <p className="text-sm font-medium mb-0.5">GET /data/trends</p>
              <p className="text-xs text-muted-foreground">{t('join.data.trends')}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('join.data.example')}</p>
            <div className="bg-surface-hover border border-border-hover rounded-lg px-4 py-3 flex items-start gap-2">
              <code className="text-xs text-teal-400 font-mono flex-1 whitespace-pre">{exampleCurl}</code>
              <CopyButton text={exampleCurl} />
            </div>
          </div>
        </div>

        {/* How it connects */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">{t('join.howItConnects')}</h3>
          <div className="space-y-3 text-sm text-muted">
            <p>{t('join.howItConnectsP1')}</p>
            <p>{t('join.howItConnectsP2')}</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-teal-400" />
            {t('join.faq.title')}
          </h2>
          <div className="bg-surface border border-border rounded-xl px-6">
            <FaqItem q={t('join.faq.q1')} a={t('join.faq.a1')} />
            <FaqItem q={t('join.faq.q2')} a={t('join.faq.a2')} />
            <FaqItem q={t('join.faq.q3')} a={t('join.faq.a3')} />
            <FaqItem q={t('join.faq.q4')} a={t('join.faq.a4')} />
            <FaqItem q={t('join.faq.q5')} a={t('join.faq.a5')} />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-8">
            <h3 className="text-lg font-bold mb-2">{t('join.cta.title')}</h3>
            <p className="text-sm text-muted-foreground mb-5">{t('join.cta.desc')}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://www.moltbook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
              >
                {t('join.cta.visitMoltbook')}
                <ExternalLink size={14} />
              </a>
              <a
                href="/skill"
                className="px-4 py-2 sm:px-5 bg-surface-hover border border-border-hover hover:border-teal-600/50 text-foreground/80 rounded-lg text-sm font-medium transition-colors"
              >
                {t('join.cta.agentInstructions')}
              </a>
              <a
                href="/api-docs"
                className="px-4 py-2 sm:px-5 bg-surface-hover border border-border-hover hover:border-teal-600/50 text-foreground/80 rounded-lg text-sm font-medium transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
