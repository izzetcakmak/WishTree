'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TreePine, Sparkles, Globe } from 'lucide-react';
import Header from './header';
import WalletButton from './wallet-button';
import WishForm from './wish-form';
import WishCard from './wish-card';
import WishTreeVisual from './wish-tree-visual';
import PhoneOnboardQR from '@/components/onboard/PhoneOnboardQR';
import { getAllWishes } from '@/lib/blockchain';
import { useT } from '@/lib/i18n';

// Suppress ethers overflow errors from console
if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    const msg = args?.[0]?.toString?.() ?? '';
    if (msg?.includes?.('NUMERIC_FAULT') || msg?.includes?.('overflow')) return;
    origError?.(...args);
  };
}

interface DbWish {
  id: string;
  content: string;
  walletAddress: string;
  txHash: string | null;
  createdAt: string;
  analysis: { sentiment: string; category: string; score: number } | null;
}

export default function HomeContent() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainWishes, setChainWishes] = useState<string[]>([]);
  const [dbWishes, setDbWishes] = useState<DbWish[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useT();

  const fetchWishes = useCallback(async () => {
    setLoading(true);
    try {
      let onChain: string[] = [];
      let dbRes: any[] = [];
      try { onChain = await getAllWishes(); } catch {}
      try { const r = await fetch('/api/wishes'); dbRes = await r?.json?.(); } catch {}
      setChainWishes(Array.isArray(onChain) ? onChain : []);
      setDbWishes(Array.isArray(dbRes) ? dbRes : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const handleWishSent = () => {
    setTimeout(fetchWishes, 2000);
  };

  const displayWishes = (dbWishes?.length ?? 0) > 0
    ? dbWishes
    : (chainWishes ?? []).map((w: string, i: number) => ({
        id: `chain-${i}`,
        content: w,
        walletAddress: 'On-chain',
        txHash: null,
        createdAt: '',
        analysis: null,
      }));

  const recentWishes = (displayWishes ?? []).slice(0, 6);

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {t('home.title')} <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">{t('home.titleAccent')}</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
              {t('home.subtitle')}
            </p>
          </motion.div>

          {/* Tree Visual */}
          <WishTreeVisual wishCount={chainWishes?.length ?? 0} />

          {/* Wallet + Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4 mb-10"
          >
            <WalletButton
              onConnect={(addr: string) => setWalletAddress(addr)}
              onDisconnect={() => setWalletAddress(null)}
            />
            <WishForm walletAddress={walletAddress} onWishSent={handleWishSent} />
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-6 glass">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-center gap-8 md:gap-16">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
            <TreePine className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold">{chainWishes?.length ?? 0}</p>
            <p className="text-xs text-gray-400">{t('home.totalWishes')}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center">
            <Sparkles className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{chainWishes?.length ?? 0}</p>
            <p className="text-xs text-gray-400">{t('home.nftsMinted')}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center">
            <Globe className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">Arc</p>
            <p className="text-xs text-gray-400">{t('home.testnet')}</p>
          </motion.div>
        </div>
      </section>

      {/* Recent Wishes */}
      <section className="py-12">
        <div className="max-w-[1200px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* WhatsApp Onboarding */}
            <div className="mb-10">
              <PhoneOnboardQR />
            </div>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              {t('home.recentWishes')}
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i: number) => (
                  <div key={i} className="p-4 rounded-xl glass animate-shimmer h-24" />
                ))}
              </div>
            ) : (recentWishes?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(recentWishes ?? []).map((w: any, i: number) => (
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
              <div className="text-center py-12 glass rounded-xl">
                <TreePine className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">{t('home.noWishesYet')}</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><TreePine className="w-3 h-3" /> WishTree</span>
          <span>{t('home.poweredBy')}</span>
        </div>
      </footer>
    </div>
  );
}
