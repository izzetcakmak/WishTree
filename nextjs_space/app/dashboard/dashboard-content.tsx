'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TreePine, Wallet, Sparkles, BarChart3, TrendingUp, Hash } from 'lucide-react';
import Header from '../components/header';
import WalletButton from '../components/wallet-button';
import WishCard from '../components/wish-card';
import { getAllWishes, getTotalSupply } from '@/lib/blockchain';
import dynamic from 'next/dynamic';

const DashboardChart = dynamic(() => import('./dashboard-chart'), { ssr: false, loading: () => <div className="h-64 glass rounded-xl animate-shimmer" /> });

interface DbWish {
  id: string;
  content: string;
  walletAddress: string;
  txHash: string | null;
  createdAt: string;
  analysis: { sentiment: string; category: string; score: number } | null;
}

export default function DashboardContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainWishes, setChainWishes] = useState<string[]>([]);
  const [dbWishes, setDbWishes] = useState<DbWish[]>([]);
  const [totalSupply, setTotalSupply] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [onChain, dbRes, supply] = await Promise.all([
        getAllWishes().catch(() => []),
        fetch('/api/wishes').then((r: any) => r?.json?.()).catch(() => []),
        getTotalSupply().catch(() => 0),
      ]);
      setChainWishes(onChain ?? []);
      setDbWishes(Array.isArray(dbRes) ? dbRes : []);
      setTotalSupply(supply ?? 0);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const myWishes = walletAddress
    ? (dbWishes ?? []).filter((w: any) => (w?.walletAddress ?? '').toLowerCase() === walletAddress.toLowerCase())
    : [];

  const categoryCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
  for (const w of (dbWishes ?? [])) {
    const cat = w?.analysis?.category ?? 'other';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    const sent = w?.analysis?.sentiment ?? 'neutral';
    if (sent in sentimentCounts) sentimentCounts[sent] = (sentimentCounts[sent] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-accent" />
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 mb-6">Overview of WishTree activity and your contributions.</p>
        </motion.div>

        {/* Wallet */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 flex items-center gap-3">
          <Wallet className="w-4 h-4 text-gray-400" />
          <WalletButton onConnect={(addr: string) => setWalletAddress(addr)} />
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Wishes', value: chainWishes?.length ?? 0, icon: TreePine, color: 'text-accent' },
            { label: 'NFTs Minted', value: totalSupply, icon: Sparkles, color: 'text-yellow-400' },
            { label: 'My Wishes', value: myWishes?.length ?? 0, icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Categories', value: Object.keys(categoryCounts ?? {})?.length ?? 0, icon: Hash, color: 'text-purple-400' },
          ].map((stat: any, i: number) => {
            const StatIcon = stat?.icon ?? TreePine;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-4 rounded-xl glass hover:shadow-lg transition-shadow"
              >
                <StatIcon className={`w-5 h-5 ${stat?.color ?? 'text-accent'} mb-2`} />
                <p className="text-2xl font-bold">{stat?.value ?? 0}</p>
                <p className="text-xs text-gray-400">{stat?.label ?? ''}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <DashboardChart categoryCounts={categoryCounts ?? {}} sentimentCounts={sentimentCounts ?? {}} />
        </motion.div>

        {/* My Wishes */}
        {walletAddress && (myWishes?.length ?? 0) > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TreePine className="w-5 h-5 text-accent" />
              My Wishes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(myWishes ?? []).map((w: any, i: number) => (
                <WishCard
                  key={w?.id ?? i}
                  content={w?.content ?? ''}
                  index={i}
                  walletAddress={w?.walletAddress}
                  sentiment={w?.analysis?.sentiment}
                  category={w?.analysis?.category}
                  createdAt={w?.createdAt}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
