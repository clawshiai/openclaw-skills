'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import { Send, Loader2, Trash2, Terminal, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

const STORAGE_KEY = 'clawshi-terminal-history';
const TYPING_SPEED = 8; // ms per character

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') return '/api';
    const host = window.location.hostname;
    return `http://${host}:3456`;
  }
  return 'http://localhost:3456';
}

// Custom hook for typing effect
function useTypingEffect(text: string, isActive: boolean, speed: number = TYPING_SPEED) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        // Type multiple characters at once for speed
        const chunk = text.slice(index, index + 3);
        setDisplayedText(prev => prev + chunk);
        index += 3;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isActive, speed]);

  return { displayedText, isComplete };
}

// Typing message component
function TypingMessage({ content, isTyping, onComplete }: {
  content: string;
  isTyping: boolean;
  onComplete?: () => void;
}) {
  const { displayedText, isComplete } = useTypingEffect(content, isTyping);
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    if (isComplete && onComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [isComplete, onComplete]);

  // Reset the ref when content changes
  useEffect(() => {
    hasCalledComplete.current = false;
  }, [content]);

  return (
    <div className="terminal-output">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-teal-400 font-bold text-lg mt-4 mb-2 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-teal-300 font-semibold text-base mt-3 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-foreground font-medium text-sm mt-2 mb-1">
              {children}
            </h3>
          ),
          // Better paragraph styling
          p: ({ children }) => (
            <p className="text-foreground/90 text-sm leading-relaxed mb-2">
              {children}
            </p>
          ),
          // Styled lists
          ul: ({ children }) => (
            <ul className="space-y-1 mb-3 ml-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 mb-3 ml-1 list-decimal list-inside">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground/90 flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          // Code blocks
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-teal-900/30 text-teal-300 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-surface-hover p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 text-foreground/80">
                {children}
              </code>
            );
          },
          // Strong/bold
          strong: ({ children }) => (
            <strong className="text-foreground font-semibold">
              {children}
            </strong>
          ),
          // Emphasis/italic
          em: ({ children }) => (
            <em className="text-foreground/80 italic">
              {children}
            </em>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-teal-500 pl-3 my-2 text-foreground/70 italic">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="border-border my-3" />
          ),
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isTyping && !isComplete && (
        <span className="inline-block w-2 h-4 bg-teal-400 animate-pulse ml-0.5" />
      )}
    </div>
  );
}


export default function TerminalPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingId, setTypingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Mark all loaded messages as not typing
        setMessages(parsed.map((m: Message) => ({ ...m, isTyping: false })));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // Save history to localStorage (without typing state)
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.map(({ isTyping, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, typingId]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleTypingComplete = useCallback((id: string) => {
    setTypingId(null);
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, isTyping: false } : m
    ));
  }, []);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBase()}/terminal/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString(),
        isTyping: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTypingId(assistantId);
    } catch (err) {
      console.error('Terminal error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
    setTypingId(null);
  }

  // Skip typing animation
  function skipTyping() {
    if (typingId) {
      setMessages(prev => prev.map(m =>
        m.id === typingId ? { ...m, isTyping: false } : m
      ));
      setTypingId(null);
    }
  }

  const suggestions = [
    t('terminal.suggestion1') || 'What are the top markets?',
    t('terminal.suggestion2') || 'Show me crypto signals',
    t('terminal.suggestion3') || 'Who are the top agents?',
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 flex flex-col min-h-0">
        {/* Fixed Terminal Header */}
        <div className="flex-shrink-0 bg-background py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center">
                <Terminal size={20} className="text-teal-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {t('terminal.title') || 'Clawshi Terminal'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Powered by{' '}
                  <a
                    href="https://x.com/openclaw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    OpenClaw
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {typingId && (
                <button
                  onClick={skipTyping}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-surface hover:bg-surface-hover border border-border rounded-lg transition-colors"
                >
                  Skip
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  {t('terminal.clear') || 'Clear'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2 min-h-0">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-600/10 flex items-center justify-center">
                <Sparkles size={32} className="text-teal-400" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                {t('terminal.welcome') || 'Welcome to Clawshi Terminal'}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t('terminal.welcomeDesc') || 'Ask me about prediction markets, signals, and more.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 text-sm bg-surface border border-border hover:border-teal-600/50 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] bg-teal-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                  <p className="text-sm">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[90%] bg-surface/50 border border-border/50 rounded-2xl rounded-bl-md px-5 py-4">
                  <TypingMessage
                    content={msg.content}
                    isTyping={msg.isTyping || false}
                    onComplete={() => handleTypingComplete(msg.id)}
                  />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface/50 border border-border/50 rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input Form */}
        <div className="flex-shrink-0 bg-background pt-3 pb-4 border-t border-border/50">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('terminal.placeholder') || 'Ask about prediction markets...'}
              disabled={loading}
              maxLength={1000}
              className="flex-1 bg-surface border border-border hover:border-border-hover focus:border-teal-600/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:outline-none disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>

          {/* Footer hint */}
          <p className="text-center text-xs text-subtle mt-2">
            {t('terminal.hint') || 'Responses are generated by AI and may not always be accurate.'}
          </p>
        </div>
      </main>
    </div>
  );
}
