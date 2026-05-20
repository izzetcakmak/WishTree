'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, DollarSign, Bot, Clock, ExternalLink } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Blessing {
  id: string;
  blesserAddress: string;
  amount: number;
  message: string | null;
  txHash: string | null;
  chainSource: string;
  agentId: string | null;
  createdAt: string;
}

interface BlessingListProps {
  wishId: string;
  refreshKey?: number;
}

export default function BlessingList({ wishId, refreshKey }: BlessingListProps) {
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [totalBlessed, setTotalBlessed] = useState(0);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    const fetchBlessings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/wishes/${wishId}/blessings`);
        const data = await res.json();
        setBlessings(data?.blessings || []);
        setTotalBlessed(data?.totalBlessed || 0);
      } catch (err) {
        console.error('Fetch blessings error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlessings();
  }, [wishId, refreshKey]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (blessings.length === 0) {
    return (
      <div className="text-center py-6">
        <Heart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">{t('bless.noBlessings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Total */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20">
        <span className="text-sm text-pink-300 font-medium flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          {t('bless.totalBlessed')}
        </span>
        <span className="text-sm text-white font-bold">{totalBlessed.toFixed(2)} USDC</span>
      </div>

      {/* List */}
      {blessings.map((b, i) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all"
        >
          <div className={`p-1.5 rounded-lg ${b.agentId ? 'bg-blue-500/20' : 'bg-pink-500/20'}`}>
            {b.agentId ? (
              <Bot className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Heart className="w-3.5 h-3.5 text-pink-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-300">
                {b.blesserAddress.slice(0, 6)}...{b.blesserAddress.slice(-4)}
              </span>
              {b.chainSource !== 'arc' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                  {b.chainSource}
                </span>
              )}
              {b.agentId && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  AI Agent
                </span>
              )}
            </div>
            {b.message && (
              <p className="text-xs text-white/70 mt-0.5">{b.message}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {new Date(b.createdAt).toLocaleDateString()}
              </span>
              {b.txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${b.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3 h-3" /> tx
                </a>
              )}
            </div>
          </div>
          <span className="text-sm font-bold text-white">{b.amount} USDC</span>
        </motion.div>
      ))}
    </div>
  );
}
