'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, MessageCircle, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useT, useLangStore } from '@/lib/i18n';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+14155238886';
const WHATSAPP_DEEPLINK = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Merhaba%20WishTree!`;

export default function PhoneOnboardQR() {
  const t = useT();
  const { lang } = useLangStore();
  const [copied, setCopied] = useState(false);
  const [QRComponent, setQRComponent] = useState<any>(null);

  useEffect(() => {
    import('react-qr-code').then((mod) => {
      setQRComponent(() => mod.default);
    });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(WHATSAPP_NUMBER).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 max-w-sm mx-auto text-center"
    >
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-2xl bg-green-500/20">
          <MessageCircle className="w-8 h-8 text-green-400" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{t('onboard.title')}</h3>
      <p className="text-sm text-gray-400 mb-4">{t('onboard.subtitle')}</p>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl inline-block mb-4">
        {QRComponent ? (
          <QRComponent value={WHATSAPP_DEEPLINK} size={160} />
        ) : (
          <div className="w-40 h-40 flex items-center justify-center">
            <QrCode className="w-16 h-16 text-gray-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* WhatsApp number */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Smartphone className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-mono text-white">{WHATSAPP_NUMBER}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Deeplink button */}
      <a
        href={WHATSAPP_DEEPLINK}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        {t('onboard.openWhatsApp')}
      </a>

      {/* Steps */}
      <div className="mt-5 space-y-2 text-left">
        <div className="flex items-start gap-2">
          <span className="text-xs bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
          <p className="text-xs text-gray-400">{t('onboard.step1')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
          <p className="text-xs text-gray-400">{t('onboard.step2')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
          <p className="text-xs text-gray-400">{t('onboard.step3')}</p>
        </div>
      </div>
    </motion.div>
  );
}
