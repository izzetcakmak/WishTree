'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Loader2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { ethers } from 'ethers';
import { BLESSING_POOL_ADDRESS, BLESSING_POOL_ABI, USDC_ADDRESS, USDC_ABI } from '@/lib/contracts/blessing-pool';
import { getProvider } from '@/lib/blockchain';
import { useT } from '@/lib/i18n';

const PRESET_AMOUNTS = [1, 5, 10, 25];

interface BlessModalProps {
  wishId: string;
  wishContent: string;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'amount' | 'approving' | 'blessing' | 'success' | 'error';

export default function BlessModal({ wishId, wishContent, onClose, onComplete }: BlessModalProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const t = useT();

  const handleBless = async () => {
    try {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) {
        setError(t('bless.invalidAmount'));
        return;
      }

      if (!BLESSING_POOL_ADDRESS || !USDC_ADDRESS) {
        setError(t('bless.contractNotDeployed'));
        return;
      }

      const provider = await getProvider();
      if (!provider) {
        setError(t('bless.noWallet'));
        return;
      }

      const signer = provider.getSigner();
      const blesserAddress = await signer.getAddress();
      const usdcAmount = ethers.utils.parseUnits(amount, 6); // USDC 6 decimals

      // Step 1: USDC Approve
      setStep('approving');
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

      // Check allowance
      const currentAllowance = await usdc.allowance(blesserAddress, BLESSING_POOL_ADDRESS);
      if (currentAllowance.lt(usdcAmount)) {
        const approveTx = await usdc.approve(BLESSING_POOL_ADDRESS, usdcAmount);
        await approveTx.wait();
      }

      // Step 2: Bless
      setStep('blessing');

      // wishTokenId'yi DB'deki wish'in tokenId'sinden al
      const wishRes = await fetch(`/api/wishes`);
      const wishes = await wishRes.json();
      const wish = (Array.isArray(wishes) ? wishes : []).find((w: any) => w.id === wishId);
      const wishTokenId = wish?.tokenId || 0;

      if (wishTokenId > 0) {
        // On-chain bless
        const bp = new ethers.Contract(BLESSING_POOL_ADDRESS, BLESSING_POOL_ABI, signer);
        const blessTx = await bp.bless(
          wishTokenId,
          usdcAmount,
          message || '',
          ethers.constants.HashZero // agentId = 0 (user bless)
        );
        const receipt = await blessTx.wait();
        setTxHash(receipt.transactionHash);

        // DB'ye kaydet
        await fetch(`/api/wishes/${wishId}/bless`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blesserAddress,
            amount: numAmount,
            message,
            txHash: receipt.transactionHash,
            chainSource: 'arc',
          }),
        });
      } else {
        // Sadece DB bless (kontrat kaydı yok)
        const res = await fetch(`/api/wishes/${wishId}/bless`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blesserAddress,
            amount: numAmount,
            message,
            chainSource: 'arc',
          }),
        });
        if (!res.ok) throw new Error('Bless failed');
      }

      setStep('success');
    } catch (err: any) {
      console.error('Bless error:', err);
      setError(err?.message || 'Transaction failed');
      setStep('error');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass rounded-t-2xl sm:rounded-2xl p-6 relative max-h-[85vh] overflow-y-auto"
        >
          {/* Close */}
          <button onClick={onClose} className="sticky top-0 float-right text-gray-400 hover:text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-pink-500/20">
              <Heart className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('bless.title')}</h3>
              <p className="text-xs text-gray-400">{t('bless.subtitle')}</p>
            </div>
          </div>

          {/* Wish preview */}
          <div className="p-3 rounded-xl bg-white/5 mb-4">
            <p className="text-sm text-white/80 line-clamp-2">{wishContent}</p>
          </div>

          {/* Amount Step */}
          {step === 'amount' && (
            <div className="space-y-4">
              {/* Preset amounts */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      amount === String(preset)
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/25'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {preset} USDC
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={t('bless.customAmount')}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:border-pink-500/50 focus:outline-none"
                />
              </div>

              {/* Message */}
              <textarea
                placeholder={t('bless.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:border-pink-500/50 focus:outline-none resize-none"
              />

              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {error}
                </p>
              )}

              <button
                onClick={handleBless}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('bless.send')} {amount ? `${amount} USDC` : ''}
              </button>
            </div>
          )}

          {/* Approving Step */}
          {step === 'approving' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
              <p className="text-sm text-white/80">{t('bless.approving')}</p>
              <p className="text-xs text-gray-400">{t('bless.confirmInWallet')}</p>
            </div>
          )}

          {/* Blessing Step */}
          {step === 'blessing' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
              <p className="text-sm text-white/80">{t('bless.sending')}</p>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>
              <p className="text-sm text-white font-medium">{t('bless.success')}</p>
              <p className="text-xs text-gray-400">{amount} USDC</p>
              {txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  {t('bless.viewTx')}
                </a>
              )}
              <button
                onClick={onComplete}
                className="mt-2 px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-all"
              >
                {t('bless.close')}
              </button>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => { setStep('amount'); setError(''); }}
                className="mt-2 px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-all"
              >
                {t('bless.retry')}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
