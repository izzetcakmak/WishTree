'use client';
import { motion } from 'framer-motion';
import { Sparkles, TreePine, Heart, Briefcase, GraduationCap, Coins, Plane, Users, Star, Activity, DollarSign } from 'lucide-react';
import BlessButton from '@/components/bless/BlessButton';

interface WishCardProps {
  content: string;
  index: number;
  walletAddress?: string;
  sentiment?: string | null;
  category?: string | null;
  createdAt?: string;
  wishId?: string;
  totalBlessed?: number;
}

const categoryIcons: Record<string, any> = {
  love: Heart,
  career: Briefcase,
  education: GraduationCap,
  money: Coins,
  travel: Plane,
  family: Users,
  health: Activity,
  spiritual: Sparkles,
};

export default function WishCard({ content, index, walletAddress, sentiment, category, createdAt, wishId, totalBlessed }: WishCardProps) {
  const Icon = categoryIcons?.[category ?? ''] ?? Star;
  const shortAddr = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Anonymous';

  const sentimentBg = (() => {
    if (sentiment === 'positive') return 'from-green-500/10 to-emerald-500/10';
    if (sentiment === 'negative') return 'from-red-500/10 to-pink-500/10';
    return 'from-yellow-500/10 to-amber-500/10';
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, shadow: '0 20px 40px rgba(0,0,0,0.2)' }}
      className={`p-4 rounded-xl bg-gradient-to-br ${sentimentBg} border border-white/10 backdrop-blur-sm hover:shadow-lg transition-all cursor-default group`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed mb-2 text-white">{content ?? ''}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-gray-200">{shortAddr}</span>
            {category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/30 text-purple-200 font-medium">
                {category}
              </span>
            )}
            {sentiment && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                sentiment === 'positive' ? 'bg-green-500/30 text-green-200' :
                sentiment === 'negative' ? 'bg-red-500/30 text-red-200' :
                'bg-yellow-500/30 text-yellow-200'
              }`}>
                {sentiment}
              </span>
            )}
            {createdAt && (
              <span className="text-[10px] text-gray-200">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            )}
            {(totalBlessed ?? 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-medium flex items-center gap-0.5">
                <DollarSign className="w-2.5 h-2.5" /> {totalBlessed} USDC
              </span>
            )}
          </div>
          {/* Bless Button */}
          {wishId && (
            <div className="mt-2">
              <BlessButton wishId={wishId} wishContent={content} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
