'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Sparkles, Loader2, BarChart3, Search, Filter } from 'lucide-react';
import Header from '../components/header';
import WishCard from '../components/wish-card';
import { getAllWishes } from '@/lib/blockchain';
import { useT } from '@/lib/i18n';

interface DbWish {
  id: string;
  content: string;
  walletAddress: string;
  txHash: string | null;
  createdAt: string;
  analysis: { sentiment: string; category: string; score: number } | null;
}

interface Summary {
  totalWishes: number;
  topThemes: string[];
  overallMood: string;
  moodScore: number;
  summary: string;
  interestingInsight: string;
}

export default function WishesContent() {
  const [chainWishes, setChainWishes] = useState<string[]>([]);
  const [dbWishes, setDbWishes] = useState<DbWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const t = useT();

  const fetchWishes = useCallback(async () => {
    setLoading(true);
    try {
      const [onChain, dbRes] = await Promise.all([
        getAllWishes().catch(() => []),
        fetch('/api/wishes').then((r: any) => r?.json?.()).catch(() => []),
      ]);
      setChainWishes(onChain ?? []);
      setDbWishes(Array.isArray(dbRes) ? dbRes : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishes(); }, [fetchWishes]);

  const allWishes = (dbWishes?.length ?? 0) > 0
    ? dbWishes
    : (chainWishes ?? []).map((w: string, i: number) => ({
        id: `chain-${i}`,
        content: w,
        walletAddress: 'On-chain',
        txHash: null,
        createdAt: '',
        analysis: null,
      }));

  const filteredWishes = (allWishes ?? []).filter((w: any) => {
    const matchSearch = !search || (w?.content ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || w?.analysis?.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const categories = ['all', ...new Set((dbWishes ?? []).map((w: any) => w?.analysis?.category).filter(Boolean))];

  const generateSummary = async () => {
    setLoadingSummary(true);
    try {
      const wishTexts = (allWishes ?? []).map((w: any) => w?.content ?? '').filter(Boolean);
      if ((wishTexts?.length ?? 0) === 0) return;
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishes: wishTexts }),
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
                setSummary(parsed?.result ?? null);
                return;
              }
            } catch {}
          }
        }
      }
    } catch {} finally {
      setLoadingSummary(false);
    }
  };

  const moodColor = (mood: string) => {
    if (mood === 'positive') return 'text-green-400';
    if (mood === 'negative') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TreePine className="w-7 h-7 text-accent" />
            {t('wishes.title')}
          </h1>
          <p className="text-sm text-gray-400 mb-6">{t('wishes.subtitle')}</p>
        </motion.div>

        {/* AI Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          {!summary ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateSummary}
              disabled={loadingSummary || (allWishes?.length ?? 0) === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-accent/20 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-colors disabled:opacity-50"
            >
              {loadingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loadingSummary ? t('wishes.analyzingAll') : t('wishes.generateSummary')}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl glass bg-gradient-to-br from-purple-500/5 to-accent/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">{t('wishes.aiSummary')}</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">{summary?.summary ?? ''}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg glass text-center">
                  <p className="text-lg font-bold">{summary?.totalWishes ?? 0}</p>
                  <p className="text-xs text-gray-400">{t('wishes.totalWishes')}</p>
                </div>
                <div className="p-3 rounded-lg glass text-center">
                  <p className={`text-lg font-bold ${moodColor(summary?.overallMood ?? '')}`}>{summary?.overallMood ?? 'mixed'}</p>
                  <p className="text-xs text-gray-400">{t('wishes.overallMood')}</p>
                </div>
                <div className="p-3 rounded-lg glass text-center">
                  <p className="text-lg font-bold text-accent">{((summary?.moodScore ?? 0) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-400">{t('wishes.moodScore')}</p>
                </div>
                <div className="p-3 rounded-lg glass">
                  <div className="flex flex-wrap gap-1">
                    {(summary?.topThemes ?? []).map((th: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">{th}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('wishes.topThemes')}</p>
                </div>
              </div>
              {summary?.interestingInsight && (
                <p className="text-xs text-gray-400 mt-3 italic">💡 {summary.interestingInsight}</p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e: any) => setSearch(e?.target?.value ?? '')}
              placeholder={t('wishes.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-500" />
            {(categories ?? []).map((cat: string) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                  filterCategory === cat ? 'bg-accent/20 text-accent' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Wishes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i: number) => (
              <div key={i} className="p-4 rounded-xl glass animate-shimmer h-24" />
            ))}
          </div>
        ) : (filteredWishes?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filteredWishes ?? []).map((w: any, i: number) => (
              <WishCard
                key={w?.id ?? i}
                content={w?.content ?? ''}
                index={i}
                walletAddress={w?.walletAddress}
                sentiment={w?.analysis?.sentiment}
                category={w?.analysis?.category ?? w?.category}
                createdAt={w?.createdAt}
                wishId={w?.id}
                totalBlessed={w?.totalBlessed}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-xl">
            <TreePine className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">{search ? t('wishes.noMatch') : t('wishes.noWishes')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
