'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, MessageCircle, QrCode, Copy, CheckCircle, FlaskConical, ShieldCheck } from 'lucide-react';
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

      {/* Sandbox badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 mb-3">
        <FlaskConical className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] font-bold text-amber-400">{t('onboard.sandboxBadge')}</span>
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{t('onboard.title')}</h3>
      <p className="text-sm text-gray-400 mb-3">{t('onboard.subtitle')}</p>

      {/* Trust note */}
      <div className="flex items-start gap-2 text-left bg-white/5 rounded-lg p-2.5 mb-4">
        <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-snug">{t('onboard.trustNote')}</p>
      </div>

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

      {/* Example message flow */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold text-gray-300 mb-2">{t('onboard.exampleTitle')}</p>
        <div className="space-y-1.5 text-left">
          <div className="flex justify-end"><span className="text-[11px] bg-green-600/30 text-green-300 rounded-lg px-2.5 py-1 max-w-[80%]">{t('onboard.exampleUser1')}</span></div>
          <div className="flex justify-start"><span className="text-[11px] bg-white/10 text-gray-300 rounded-lg px-2.5 py-1 max-w-[80%]">{t('onboard.exampleBot1')}</span></div>
          <div className="flex justify-end"><span className="text-[11px] bg-green-600/30 text-green-300 rounded-lg px-2.5 py-1 max-w-[80%]">{t('onboard.exampleUser2')}</span></div>
          <div className="flex justify-start"><span className="text-[11px] bg-white/10 text-gray-300 rounded-lg px-2.5 py-1 max-w-[80%]">{t('onboard.exampleBot2')}</span></div>
        </div>
      </div>
    </motion.div>
  );
}
