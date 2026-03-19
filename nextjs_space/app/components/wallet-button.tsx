'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { connectWallet, switchToArcTestnet, checkNetwork } from '@/lib/blockchain';
import { useT } from '@/lib/i18n';

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletButton({ onConnect, onDisconnect }: WalletButtonProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  const checkWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    if (!win?.ethereum) return;
    try {
      const accounts = await win.ethereum.request({ method: 'eth_accounts' });
      if (accounts?.[0]) {
        setAddress(accounts[0]);
        onConnect?.(accounts[0]);
        const chainIdHex = await win.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        setIsCorrectNetwork(chainId === 5042002);
      }
    } catch {}
  }, [onConnect]);

  useEffect(() => {
    checkWallet();
    const win = window as any;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts?.[0]) {
        setAddress(accounts[0]);
        onConnect?.(accounts[0]);
      } else {
        setAddress(null);
        onDisconnect?.();
      }
    };
    const handleChainChanged = (_chainId: string) => {
      const newChainId = typeof _chainId === 'string' ? parseInt(_chainId, 16) : 0;
      setIsCorrectNetwork(newChainId === 5042002);
    };
    win?.ethereum?.on?.('accountsChanged', handleAccountsChanged);
    win?.ethereum?.on?.('chainChanged', handleChainChanged);
    return () => {
      win?.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      win?.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [checkWallet, onConnect, onDisconnect]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const win = window as any;
      if (!win?.ethereum) {
        setError(t('wallet.notFound'));
        return;
      }
      const addr = await connectWallet();
      if (addr) {
        setAddress(addr);
        onConnect?.(addr);
        const chainIdHex = await win.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);
        const isArc = currentChainId === 5042002;
        if (isArc) {
          setIsCorrectNetwork(true);
        } else {
          setIsCorrectNetwork(false);
          const switched = await switchToArcTestnet();
          if (switched) {
            await new Promise((r) => setTimeout(r, 500));
            const recheckHex = await win.ethereum.request({ method: 'eth_chainId' });
            setIsCorrectNetwork(parseInt(recheckHex, 16) === 5042002);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? t('wallet.connectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setLoading(true);
    try {
      const switched = await switchToArcTestnet();
      if (switched) {
        await new Promise((r) => setTimeout(r, 500));
        const correct = await checkNetwork();
        setIsCorrectNetwork(correct);
      }
    } catch (err) {
      console.error('Switch network error:', err);
    }
    setLoading(false);
  };

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  if (!address) {
    return (
      <div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-emerald-500 text-white font-medium shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
          {loading ? t('wallet.connecting') : t('wallet.connect')}
        </motion.button>
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs mt-2">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSwitchNetwork}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium"
      >
        <AlertTriangle className="w-4 h-4" />
        {loading ? t('wallet.switching') : t('wallet.switchNetwork')}
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass">
      <Check className="w-4 h-4 text-accent" />
      <span className="text-sm font-mono">{shortAddr}</span>
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
    </div>
  );
}
