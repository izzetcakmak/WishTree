'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Check, TreePine, Heart, Briefcase, GraduationCap, Coins, Plane, Users, Star } from 'lucide-react';
import { makeAWish } from '@/lib/blockchain';
import { WISH_COST } from '@/lib/contract';
import { useT } from '@/lib/i18n';

interface WishAnalysis {
  sentiment: string;
  category: string;
  score: number;
  interpretation: string;
}

interface WishFormProps {
  walletAddress: string | null;
  onWishSent?: (wish: string, txHash: string, analysis?: WishAnalysis) => void;
}

export default function WishForm({ walletAddress, onWishSent }: WishFormProps) {
  const [wish, setWish] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'sending' | 'confirming' | 'success' | 'error'>('idle');
  const [analysis, setAnalysis] = useState<WishAnalysis | null>(null);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const t = useT();

  const CATEGORIES = [
    { label: t('cat.love'), value: 'love', icon: Heart },
    { label: t('cat.career'), value: 'career', icon: Briefcase },
    { label: t('cat.education'), value: 'education', icon: GraduationCap },
    { label: t('cat.money'), value: 'money', icon: Coins },
    { label: t('cat.travel'), value: 'travel', icon: Plane },
    { label: t('cat.family'), value: 'family', icon: Users },
    { label: t('cat.general'), value: 'general', icon: Star },
  ];

  const analyzeWish = async (wishText: string): Promise<WishAnalysis | null> => {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wish: wishText }),
      });
      if (!response?.ok) return null;
      const reader = response?.body?.getReader();
      if (!reader) return null;
      const decoder = new TextDecoder();
      let partialRead = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines?.pop() ?? '';
        for (const line of (lines ?? [])) {
          if (line?.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed?.status === 'completed') return parsed?.result ?? null;
            } catch {}
          }
        }
      }
      return null;
    } catch { return null; }
  };

  const getSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      });
      if (!response?.ok) return;
      const reader = response?.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let partialRead = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines?.pop() ?? '';
        for (const line of (lines ?? [])) {
          if (line?.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed?.status === 'completed') {
                setSuggestions(parsed?.result?.suggestions ?? []);
                return;
              }
            } catch {}
          }
        }
      }
    } catch {} finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish?.trim() || !walletAddress) return;
    setError('');
    setStatus('analyzing');

    try {
      const wishAnalysis = await analyzeWish(wish);
      if (wishAnalysis) setAnalysis(wishAnalysis);

      setStatus('sending');
      const tx = await makeAWish(wish);
      setTxHash(tx?.hash ?? '');
      setStatus('confirming');
      await tx?.wait?.();
      setStatus('success');

      try {
        await fetch('/api/wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: wish,
            txHash: tx?.hash ?? '',
            walletAddress,
            analysis: wishAnalysis,
          }),
        });
      } catch {}

      onWishSent?.(wish, tx?.hash ?? '', wishAnalysis ?? undefined);

      setTimeout(() => {
        setWish('');
        setStatus('idle');
        setAnalysis(null);
        setTxHash('');
      }, 5000);
    } catch (err: any) {
      console.error('Wish error:', err);
      setError(err?.reason ?? err?.message ?? 'Transaction failed');
      setStatus('error');
    }
  };

  const sentimentColor = (s: string) => {
    if (s === 'positive') return 'text-green-400 bg-green-500/10';
    if (s === 'negative') return 'text-red-400 bg-red-500/10';
    return 'text-yellow-400 bg-yellow-500/10';
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* AI Suggestions */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-gray-400">{t('wishForm.getInspired')}</span>
          {CATEGORIES.map((cat: any) => {
            const Icon = cat?.icon ?? Star;
            return (
              <button
                key={cat?.value}
                onClick={() => setSelectedCategory(cat?.value)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                  selectedCategory === cat?.value
                    ? 'bg-accent/20 text-accent'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-3 h-3" /> {cat?.label}
              </button>
            );
          })}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={getSuggestions}
            disabled={loadingSuggestions}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            {loadingSuggestions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {t('wishForm.aiSuggest')}
          </motion.button>
        </div>
        <AnimatePresence>
          {(suggestions?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 mb-4"
            >
              {(suggestions ?? []).map((s: string, i: number) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => { setWish(s); setSuggestions([]); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm glass hover:bg-accent/10 transition-colors"
                >
                  ✨ {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wish Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl overflow-hidden glass animate-glow-pulse">
          <textarea
            value={wish}
            onChange={(e: any) => setWish(e?.target?.value ?? '')}
            placeholder={walletAddress ? t('wishForm.placeholder') : t('wishForm.connectFirst')}
            disabled={!walletAddress || status !== 'idle'}
            maxLength={280}
            rows={3}
            className="w-full p-4 pb-14 bg-transparent resize-none focus:outline-none placeholder-gray-500 disabled:opacity-50 text-sm"
          />
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 flex items-center justify-between bg-black/10">
            <span className="text-xs text-gray-500">
              {wish?.length ?? 0}/280 • {t('wishForm.cost')}: {WISH_COST} ARC
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!wish?.trim() || !walletAddress || status !== 'idle'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-white text-sm font-medium shadow-lg shadow-accent/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {status === 'idle' && <><Send className="w-3.5 h-3.5" /> {t('wishForm.sendWish')}</>}
              {status === 'analyzing' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('wishForm.analyzing')}</>}
              {status === 'sending' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('wishForm.sending')}</>}
              {status === 'confirming' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('wishForm.confirming')}</>}
              {status === 'success' && <><Check className="w-3.5 h-3.5" /> {t('wishForm.wishSent')}</>}
              {status === 'error' && <><Send className="w-3.5 h-3.5" /> {t('wishForm.tryAgain')}</>}
            </motion.button>
          </div>
        </div>
      </form>

      {/* Analysis Result */}
      <AnimatePresence>
        {analysis && status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl glass"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{t('wishForm.aiAnalysis')}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentimentColor(analysis?.sentiment ?? '')}`}>
                {analysis?.sentiment ?? 'neutral'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                {analysis?.category ?? 'other'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
                {((analysis?.score ?? 0) * 100).toFixed(0)}% {t('wishForm.confidence')}
              </span>
            </div>
            <p className="text-xs text-gray-400">{analysis?.interpretation ?? ''}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {status === 'success' && txHash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <TreePine className="w-5 h-5 text-accent" />
              <span className="font-medium text-accent">{t('wishForm.successTitle')}</span>
            </div>
            <p className="text-xs text-gray-400 font-mono break-all">TX: {txHash}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
