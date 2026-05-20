'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import BlessModal from './BlessModal';
import { useT } from '@/lib/i18n';

interface BlessButtonProps {
  wishId: string;
  wishContent: string;
  onBlessComplete?: () => void;
}

export default function BlessButton({ wishId, wishContent, onBlessComplete }: BlessButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const t = useT();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all"
      >
        <Heart className="w-4 h-4" />
        {t('bless.button')}
      </motion.button>

      {showModal && (
        <BlessModal
          wishId={wishId}
          wishContent={wishContent}
          onClose={() => setShowModal(false)}
          onComplete={() => {
            setShowModal(false);
            onBlessComplete?.();
          }}
        />
      )}
    </>
  );
}
