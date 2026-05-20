'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import BlessModal from './BlessModal';
import { useT } from '@/lib/i18n';

interface BlessButtonProps {
  wishId: string;
  wishContent: string;
  onBlessComplete?: () => void;
}

function PortalModal({ wishId, wishContent, onClose, onComplete }: {
  wishId: string;
  wishContent: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'bless-modal-portal';
    document.body.appendChild(div);
    setContainer(div);
    return () => { document.body.removeChild(div); };
  }, []);

  if (!container) return null;

  const { createPortal } = require('react-dom');
  return createPortal(
    <BlessModal wishId={wishId} wishContent={wishContent} onClose={onClose} onComplete={onComplete} />,
    container
  );
}

export default function BlessButton({ wishId, wishContent, onBlessComplete }: BlessButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const t = useT();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all"
      >
        <Heart className="w-4 h-4" />
        {t('bless.button')}
      </motion.button>

      {showModal && (
        <PortalModal
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
