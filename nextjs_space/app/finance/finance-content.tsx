'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, ArrowLeftRight, Send, Loader2, CheckCircle2, AlertCircle, ExternalLink, Wallet, RefreshCw, Layers, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Header from '../components/header';
import { useT } from '@/lib/i18n';
import { connectWallet, checkNetwork, switchToArcTestnet } from '@/lib/blockchain';
import { ethers } from 'ethers';

// Bridge chain options (testnet)
const BRIDGE_CHAINS = [
  { value: 'Arc_Testnet', label: 'Arc Testnet', icon: '🌐' },
  { value: 'Ethereum_Sepolia', label: 'Ethereum Sepolia', icon: '⟠' },
  { value: 'Base_Sepolia', label: 'Base Sepolia', icon: '🔵' },
  { value: 'Arbitrum_Sepolia', label: 'Arbitrum Sepolia', icon: '🔷' },
  { value: 'Avalanche_Fuji', label: 'Avalanche Fuji', icon: '🔺' },
  { value: 'Polygon_Amoy_Testnet', label: 'Polygon Amoy', icon: '🟣' },
  { value: 'Optimism_Sepolia', label: 'Optimism Sepolia', icon: '🔴' },
];

// Swap tokens on Arc Testnet — only USDC & EURC are supported by Circle SDK
const SWAP_TOKENS = [
  { value: 'USDC', label: 'USDC', icon: '💲', address: '0x3600000000000000000000000000000000000000' },
  { value: 'EURC', label: 'EURC', icon: '💶', address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' },
];

// USDC native address on Arc Testnet (18 decimals as native gas token)
const USDC_ADDRESS_ARC = '0x3600000000000000000000000000000000000000';
const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// Unified Balance supported testnet chains (Arc App Kit Unified Balance Kit v1.0)
const UNIFIED_CHAINS = [
  { value: 'Arc_Testnet', label: 'Arc Testnet', icon: '🌐' },
  { value: 'Ethereum_Sepolia', label: 'Ethereum Sepolia', icon: '⟠' },
  { value: 'Base_Sepolia', label: 'Base Sepolia', icon: '🔵' },
  { value: 'Arbitrum_Sepolia', label: 'Arbitrum Sepolia', icon: '🔷' },
  { value: 'Avalanche_Fuji', label: 'Avalanche Fuji', icon: '🔺' },
  { value: 'Polygon_Amoy_Testnet', label: 'Polygon Amoy', icon: '🟣' },
  { value: 'Optimism_Sepolia', label: 'Optimism Sepolia', icon: '🔴' },
];

type TabType = 'unified' | 'swap' | 'bridge' | 'send';

interface BalanceBreakdownEntry {
  chain: string;
  confirmedBalance: string;
  pendingBalance?: string;
}

interface TxStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  explorerUrl?: string;
}

export default function FinanceContent() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabType>('unified');

  // Unified Balance state
  const [unifiedTotal, setUnifiedTotal] = useState<string>('0.00');
  const [unifiedPending, setUnifiedPending] = useState<string | null>(null);
  const [unifiedBreakdown, setUnifiedBreakdown] = useState<BalanceBreakdownEntry[]>([]);
  const [unifiedLoading, setUnifiedLoading] = useState(false);
  const [depositChain, setDepositChain] = useState('Arc_Testnet');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositSteps, setDepositSteps] = useState<TxStep[]>([]);
  const [spendChain, setSpendChain] = useState('Ethereum_Sepolia');
  const [spendRecipient, setSpendRecipient] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendLoading, setSpendLoading] = useState(false);
  const [spendSuccess, setSpendSuccess] = useState(false);
  const [spendError, setSpendError] = useState('');
  const [spendSteps, setSpendSteps] = useState<TxStep[]>([]);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [kitKey, setKitKey] = useState<string>('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Swap state
  const [swapFrom, setSwapFrom] = useState('USDC');
  const [swapTo, setSwapTo] = useState('EURC');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapSteps, setSwapSteps] = useState<TxStep[]>([]);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapError, setSwapError] = useState('');

  // Bridge state
  const [bridgeFrom, setBridgeFrom] = useState('Ethereum_Sepolia');
  const [bridgeTo, setBridgeTo] = useState('Arc_Testnet');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeSteps, setBridgeSteps] = useState<TxStep[]>([]);
  const [bridgeSuccess, setBridgeSuccess] = useState(false);
  const [bridgeError, setBridgeError] = useState('');

  // Send state
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSteps, setSendSteps] = useState<TxStep[]>([]);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  // Fetch kit key on mount
  useEffect(() => {
    fetch('/api/finance/config')
      .then(r => r.json())
      .then(d => { if (d.kitKey) setKitKey(d.kitKey); })
      .catch(() => {});
  }, []);

  // Fetch balances
  const fetchBalances = useCallback(async (addr: string) => {
    setBalanceLoading(true);
    try {
      const win = window as any;
      if (!win?.ethereum) return;
      const provider = new ethers.providers.Web3Provider(win.ethereum, 'any');

      // Native balance (on Arc Testnet, native = USDC for gas)
      const native = await provider.getBalance(addr);
      setNativeBalance(parseFloat(ethers.utils.formatEther(native)).toFixed(4));

      // Try to read USDC token balance
      try {
        const usdc = new ethers.Contract(USDC_ADDRESS_ARC, USDC_ABI, provider);
        const decimals = await usdc.decimals();
        const balance = await usdc.balanceOf(addr);
        setUsdcBalance(parseFloat(ethers.utils.formatUnits(balance, decimals)).toFixed(2));
      } catch {
        // USDC contract might not exist or different address on testnet
        setUsdcBalance(null);
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      const addr = await connectWallet();
      if (addr) {
        setWalletAddress(addr);
        // Ensure on Arc Testnet
        const onArc = await checkNetwork();
        if (!onArc) await switchToArcTestnet();
        fetchBalances(addr);
      }
    } catch {
      // handled
    }
  }, [fetchBalances]);

  // === UNIFIED BALANCE: Helper to build context + adapter ===
  async function getUnifiedKit() {
    const ub = await import('@circle-fin/unified-balance-kit');
    const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error(t('finance.noWallet'));
    const adapter = await createViemAdapterFromProvider({ provider: ethereum });
    const context = ub.createUnifiedBalanceKitContext();
    return { ub, context, adapter };
  }

  // === UNIFIED BALANCE: Fetch balances ===
  const fetchUnifiedBalances = useCallback(async () => {
    if (!walletAddress) return;
    setUnifiedLoading(true);
    try {
      const { ub, context, adapter } = await getUnifiedKit();
      const result: any = await ub.getBalances(context, {
        sources: { adapter },
        includePending: true,
        networkType: 'testnet',
      } as any);
      setUnifiedTotal(result?.totalConfirmedBalance ?? '0.00');
      setUnifiedPending(result?.totalPendingBalance ?? null);
      const flat: BalanceBreakdownEntry[] = [];
      (result?.breakdown ?? []).forEach((acc: any) => {
        (acc?.breakdown ?? []).forEach((b: any) => {
          flat.push({
            chain: b.chain,
            confirmedBalance: b.confirmedBalance ?? '0',
            pendingBalance: b.pendingBalance,
          });
        });
      });
      setUnifiedBreakdown(flat);
    } catch (err: any) {
      console.error('Unified balance fetch error:', err);
    } finally {
      setUnifiedLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, t]);

  // Auto-fetch on connect
  useEffect(() => {
    if (walletAddress && activeTab === 'unified') {
      fetchUnifiedBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, activeTab]);

  // === UNIFIED BALANCE: Deposit ===
  async function handleDeposit() {
    if (!walletAddress) { setDepositError(t('finance.connectFirst')); return; }
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositLoading(true); setDepositError(''); setDepositSuccess(false); setDepositSteps([]);
    try {
      const { ub, context, adapter } = await getUnifiedKit();
      setDepositSteps([
        { label: 'Approving USDC...', status: 'active' },
        { label: 'Depositing to Gateway...', status: 'pending' },
      ]);
      const result: any = await ub.deposit(context, {
        from: { adapter, chain: depositChain as any },
        amount: depositAmount,
        token: 'USDC',
      } as any);

      const finalSteps: TxStep[] = [
        {
          label: `${t('finance.success')} — ${result?.amount ?? depositAmount} USDC`,
          status: 'done',
          explorerUrl: result?.explorerUrl,
        },
      ];
      setDepositSteps(finalSteps);
      setDepositSuccess(true);
      setDepositAmount('');
      setTimeout(() => fetchUnifiedBalances(), 2000);
    } catch (err: any) {
      console.error('Deposit error:', err);
      const msg = err?.code === 4001 || err?.code === 'ACTION_REJECTED'
        ? t('finance.txRejected')
        : (err?.message || t('finance.error'));
      setDepositError(msg);
      setDepositSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setDepositLoading(false);
    }
  }

  // === UNIFIED BALANCE: Spend ===
  async function handleSpend() {
    if (!walletAddress) { setSpendError(t('finance.connectFirst')); return; }
    if (!spendAmount || parseFloat(spendAmount) <= 0) return;
    if (!spendRecipient || !spendRecipient.startsWith('0x') || spendRecipient.length !== 42) {
      setSpendError('Invalid recipient address'); return;
    }
    setSpendLoading(true); setSpendError(''); setSpendSuccess(false); setSpendSteps([]);
    try {
      const { ub, context, adapter } = await getUnifiedKit();
      setSpendSteps([
        { label: 'Creating burn intent...', status: 'active' },
        { label: 'Retrieving attestation...', status: 'pending' },
        { label: 'Minting on destination...', status: 'pending' },
      ]);

      // Allocate from any chain that has balance — let Gateway pick
      const sourceAlloc: any = unifiedBreakdown.find(b => parseFloat(b.confirmedBalance) > 0);
      if (!sourceAlloc) {
        throw new Error(t('finance.noBalance'));
      }

      const result: any = await ub.spend(context, {
        from: {
          adapter,
          allocations: { amount: spendAmount, chain: sourceAlloc.chain as any },
        },
        to: {
          adapter,
          chain: spendChain as any,
          recipientAddress: spendRecipient,
        },
        amount: spendAmount,
        token: 'USDC',
      } as any);

      const finalSteps: TxStep[] = [
        {
          label: `${t('finance.success')} — ${spendAmount} USDC → ${spendChain}`,
          status: 'done',
          explorerUrl: result?.explorerUrl,
        },
      ];
      setSpendSteps(finalSteps);
      setSpendSuccess(true);
      setSpendAmount('');
      setSpendRecipient('');
      setEstimatedFee(null);
      setTimeout(() => fetchUnifiedBalances(), 2000);
    } catch (err: any) {
      console.error('Spend error:', err);
      let msg = err?.message || t('finance.error');
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
        msg = t('finance.txRejected');
      } else if (msg.includes('Insufficient') || msg.includes('insufficient')) {
        // Clean up long decimal numbers for readability
        msg = msg.replace(/(\d+\.\d{4})\d+/g, '$1');
      }
      setSpendError(msg);
      setSpendSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setSpendLoading(false);
    }
  }

  // === UNIFIED BALANCE: Estimate fee ===
  async function handleEstimate() {
    if (!walletAddress || !spendAmount || parseFloat(spendAmount) <= 0) return;
    if (!spendRecipient || !spendRecipient.startsWith('0x')) return;
    try {
      const { ub, context, adapter } = await getUnifiedKit();
      const sourceAlloc: any = unifiedBreakdown.find(b => parseFloat(b.confirmedBalance) > 0);
      if (!sourceAlloc) { setEstimatedFee(null); return; }
      const est: any = await ub.estimateSpend(context, {
        from: { adapter, allocations: { amount: spendAmount, chain: sourceAlloc.chain as any } },
        to: { adapter, chain: spendChain as any, recipientAddress: spendRecipient },
        amount: spendAmount,
        token: 'USDC',
      } as any);
      const total = est?.totalFee ?? est?.fee ?? est?.fees?.total;
      if (total) setEstimatedFee(String(total));
    } catch (err) {
      console.error('Estimate error:', err);
    }
  }

  // Dynamic import for Circle SDK (client-side)
  async function getCircleKit() {
    const { AppKit } = await import('@circle-fin/app-kit');
    const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2');
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error(t('finance.noWallet'));

    const kit = new AppKit();
    const adapter = await createViemAdapterFromProvider({
      provider: ethereum,
    });
    return { kit, adapter };
  }

  // === SWAP via Circle AppKit SDK (client-side) ===
  async function handleSwap() {
    if (!walletAddress) { setSwapError(t('finance.connectFirst')); return; }
    if (!swapAmount || parseFloat(swapAmount) <= 0) return;
    if (swapFrom === swapTo) { setSwapError('Select different tokens'); return; }
    setSwapLoading(true); setSwapError(''); setSwapSuccess(false); setSwapSteps([]);
    try {
      setSwapSteps([
        { label: 'Preparing swap via Circle SDK...', status: 'active' },
        { label: 'Waiting for wallet confirmation...', status: 'pending' },
        { label: 'Confirming on-chain...', status: 'pending' },
      ]);

      const { kit, adapter } = await getCircleKit();

      setSwapSteps([
        { label: 'Getting quote & executing swap...', status: 'active' },
        { label: 'Waiting for wallet confirmation...', status: 'pending' },
        { label: 'Confirming on-chain...', status: 'pending' },
      ]);

      const result = await kit.swap({
        from: { adapter, chain: 'Arc_Testnet' as any },
        tokenIn: swapFrom as any,
        tokenOut: swapTo as any,
        amountIn: swapAmount,
        config: {
          slippageBps: 300,
          ...(kitKey ? { kitKey } : {}),
        },
      });

      const txResult = result as any;
      setSwapSteps([
        { label: `Swapped ${swapAmount} ${swapFrom}`, status: 'done' },
        { label: `Received ${txResult?.amountOut ? `${txResult.amountOut} ${swapTo}` : `~${swapTo}`}`, status: 'done' },
        { label: t('finance.success'), status: 'done', explorerUrl: txResult?.explorerUrl },
      ]);
      setSwapSuccess(true);
      setSwapAmount('');
      if (walletAddress) fetchBalances(walletAddress);
    } catch (err: any) {
      console.error('Swap error:', err);
      let msg = err?.message || t('finance.error');
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
        msg = t('finance.txRejected');
      } else if (msg.includes('Insufficient') || msg.includes('insufficient')) {
        msg = t('finance.noBalance');
      } else if (msg.includes('route') || msg.includes('Route')) {
        msg = 'Swap route not available. Try a different token pair or amount.';
      }
      setSwapError(msg);
      setSwapSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setSwapLoading(false);
    }
  }

  // === BRIDGE (docs: kit.bridge) ===
  async function handleBridge() {
    if (!walletAddress) { setBridgeError(t('finance.connectFirst')); return; }
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return;
    if (bridgeFrom === bridgeTo) { setBridgeError('Source and destination must be different'); return; }
    setBridgeLoading(true); setBridgeError(''); setBridgeSuccess(false); setBridgeSteps([]);
    try {
      const { kit, adapter } = await getCircleKit();
      setBridgeSteps([
        { label: 'Approving USDC...', status: 'active' },
        { label: 'Burning on source chain...', status: 'pending' },
        { label: 'Waiting for attestation...', status: 'pending' },
        { label: 'Minting on destination...', status: 'pending' },
      ]);

      const result = await kit.bridge({
        from: { adapter, chain: bridgeFrom as any },
        to: { adapter, chain: bridgeTo as any },
        amount: bridgeAmount,
      });

      const steps: TxStep[] = (result as any)?.steps?.map((s: any, i: number) => ({
        label: `${t('finance.step')} ${i + 1}: ${s.action || 'Transaction'}`,
        status: 'done' as const,
        explorerUrl: s.explorerUrl || undefined,
      })) || [{ label: t('finance.success'), status: 'done' as const }];

      setBridgeSteps(steps);
      setBridgeSuccess(true);
      setBridgeAmount('');
      if (walletAddress) fetchBalances(walletAddress);
    } catch (err: any) {
      console.error('Bridge error:', err);
      let msg = err?.message || t('finance.error');
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
        msg = t('finance.txRejected');
      } else if (msg.includes('Insufficient') || msg.includes('insufficient')) {
        msg = t('finance.noBalance');
      } else if (msg.includes('attestation')) {
        msg = 'Bridge attestation failed. Please try again in a few minutes.';
      }
      setBridgeError(msg);
      setBridgeSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setBridgeLoading(false);
    }
  }

  // === SEND (docs: kit.send) ===
  async function handleSend() {
    if (!walletAddress) { setSendError(t('finance.connectFirst')); return; }
    if (!sendAmount || parseFloat(sendAmount) <= 0) return;
    if (!sendRecipient || !sendRecipient.startsWith('0x') || sendRecipient.length !== 42) {
      setSendError('Invalid recipient address'); return;
    }
    setSendLoading(true); setSendError(''); setSendSuccess(false); setSendSteps([]);
    try {
      const { kit, adapter } = await getCircleKit();
      setSendSteps([{ label: 'Sending USDC...', status: 'active' }]);

      const result = await kit.send({
        from: { adapter, chain: 'Arc_Testnet' as any },
        to: sendRecipient,
        amount: sendAmount,
        token: 'USDC',
      });

      const steps: TxStep[] = (result as any)?.steps?.map((s: any, i: number) => ({
        label: `${t('finance.step')} ${i + 1}: ${s.action || 'Transfer'}`,
        status: 'done' as const,
        explorerUrl: s.explorerUrl || undefined,
      })) || [{ label: t('finance.success'), status: 'done' as const }];

      setSendSteps(steps);
      setSendSuccess(true);
      setSendAmount('');
      setSendRecipient('');
      if (walletAddress) fetchBalances(walletAddress);
    } catch (err: any) {
      console.error('Send error:', err);
      let msg = err?.message || t('finance.error');
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
        msg = t('finance.txRejected');
      } else if (msg.includes('Insufficient') || msg.includes('insufficient')) {
        msg = t('finance.noBalance');
      }
      setSendError(msg);
      setSendSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setSendLoading(false);
    }
  }

  function renderSteps(steps: TxStep[]) {
    if (steps.length === 0) return null;
    return (
      <div className="mt-4 space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {step.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
            {step.status === 'active' && <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />}
            {step.status === 'pending' && <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />}
            {step.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span className={step.status === 'done' ? 'text-green-400' : step.status === 'error' ? 'text-red-400' : step.status === 'active' ? 'text-white' : 'text-gray-500'}>
              {step.label}
            </span>
            {step.explorerUrl && (
              <a href={step.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-accent/70 hover:text-accent">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }

  const tabs: { key: TabType; icon: any; color: string }[] = [
    { key: 'unified', icon: Layers, color: 'text-pink-400' },
    { key: 'swap', icon: ArrowDownUp, color: 'text-purple-400' },
    { key: 'bridge', icon: ArrowLeftRight, color: 'text-blue-400' },
    { key: 'send', icon: Send, color: 'text-green-400' },
  ];

  const tabLabels: Record<TabType, string> = {
    unified: t('finance.unified'),
    swap: t('finance.swap'),
    bridge: t('finance.bridge'),
    send: t('finance.send'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      <main className="max-w-[600px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                {t('finance.title')}
              </span>
            </h1>
            <p className="text-gray-400 text-sm">{t('finance.subtitle')}</p>
          </div>

          {/* Wallet Connect / Balance */}
          {!walletAddress ? (
            <div className="mb-6">
              <button
                onClick={handleConnect}
                className="w-full py-3 bg-accent/20 hover:bg-accent/30 text-accent rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                {t('finance.connectFirst')}
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-accent" />
                  <span className="font-mono text-sm text-white">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </div>
                <button
                  onClick={() => fetchBalances(walletAddress)}
                  disabled={balanceLoading}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${balanceLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-500 mb-1">Native (Gas)</div>
                  <div className="text-lg font-bold text-white">{nativeBalance ?? '...'}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-xs text-gray-500 mb-1">USDC Token</div>
                  <div className="text-lg font-bold text-green-400">{usdcBalance ?? '...'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
            {tabs.map(({ key, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === key ? 'bg-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === key ? 'text-white' : color}`} />
                {tabLabels[key]}
              </button>
            ))}
          </div>

          {/* Unified Balance Tab */}
          {activeTab === 'unified' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Total Balance Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-pink-400" />
                    <h2 className="font-semibold">{t('finance.totalBalance')}</h2>
                  </div>
                  <button
                    onClick={fetchUnifiedBalances}
                    disabled={unifiedLoading || !walletAddress}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${unifiedLoading ? 'animate-spin' : ''}`} />
                    {t('finance.refresh')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">{t('finance.unifiedDesc')}</p>
                <div className="text-4xl font-bold text-white mb-1">
                  ${unifiedTotal} <span className="text-lg text-gray-400">USDC</span>
                </div>
                {unifiedPending && parseFloat(unifiedPending) > 0 && (
                  <div className="text-xs text-yellow-400 mt-1">
                    + {unifiedPending} USDC {t('finance.pendingBalance').toLowerCase()}
                  </div>
                )}

                {/* Per-chain breakdown */}
                {unifiedBreakdown.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <div className="text-xs font-medium text-gray-400 mb-3">{t('finance.perChain')}</div>
                    <div className="space-y-2">
                      {unifiedBreakdown.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{b.chain.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-white">{parseFloat(b.confirmedBalance).toFixed(2)} USDC</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Deposit Card */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownToLine className="w-5 h-5 text-green-400" />
                  <h2 className="font-semibold text-lg">{t('finance.deposit')}</h2>
                </div>
                <p className="text-xs text-gray-500 mb-5">{t('finance.depositDesc')}</p>

                {depositSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                    <CheckCircle2 className="w-4 h-4" /> {t('finance.success')}
                  </div>
                )}
                {depositError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4 break-words">
                    <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{depositError}</span></div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('finance.depositChain')}</label>
                    <select value={depositChain} onChange={(e) => setDepositChain(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300">
                      {UNIFIED_CHAINS.map(c => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('finance.amount')} (USDC)</label>
                    <input type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                  </div>
                  <button onClick={handleDeposit} disabled={depositLoading || !depositAmount || !walletAddress} className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {depositLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                    {depositLoading ? t('finance.depositing') : t('finance.depositBtn')}
                  </button>
                </div>
                {renderSteps(depositSteps)}
              </div>

              {/* Spend Card */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpFromLine className="w-5 h-5 text-orange-400" />
                  <h2 className="font-semibold text-lg">{t('finance.spend')}</h2>
                </div>
                <p className="text-xs text-gray-500 mb-5">{t('finance.spendDesc')}</p>

                {spendSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                    <CheckCircle2 className="w-4 h-4" /> {t('finance.success')}
                  </div>
                )}
                {spendError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4 break-words">
                    <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{spendError}</span></div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('finance.spendChain')}</label>
                    <select value={spendChain} onChange={(e) => setSpendChain(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300">
                      {UNIFIED_CHAINS.map(c => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('finance.recipient')}</label>
                    <input type="text" value={spendRecipient} onChange={(e) => setSpendRecipient(e.target.value)} placeholder="0x..." className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('finance.amount')} (USDC)</label>
                    <input type="number" step="0.01" min="0" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                  </div>

                  {estimatedFee && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-sm">
                      {t('finance.estimatedFee')}: {estimatedFee} USDC
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleEstimate} disabled={!spendAmount || !spendRecipient} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      {t('finance.estimate')}
                    </button>
                    <button onClick={handleSpend} disabled={spendLoading || !spendAmount || !spendRecipient} className="flex-1 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      {spendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
                      {spendLoading ? t('finance.spending') : t('finance.spendBtn')}
                    </button>
                  </div>
                </div>
                {renderSteps(spendSteps)}
              </div>
            </motion.div>
          )}

          {/* Swap Tab */}
          {activeTab === 'swap' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownUp className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-lg">{t('finance.swap')}</h2>
              </div>
              <p className="text-xs text-gray-500 mb-5">{t('finance.swapDesc')}</p>

              {swapSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4" /> {t('finance.success')}
                </div>
              )}
              {swapError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4 break-words">
                  <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{swapError}</span></div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.fromToken')}</label>
                  <select value={swapFrom} onChange={(e) => setSwapFrom(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300">
                    {SWAP_TOKENS.map(tk => (<option key={tk.value} value={tk.value}>{tk.icon} {tk.label}</option>))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => { const tmp = swapFrom; setSwapFrom(swapTo); setSwapTo(tmp); }} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowDownUp className="w-4 h-4 text-purple-400" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.toToken')}</label>
                  <select value={swapTo} onChange={(e) => setSwapTo(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300">
                    {SWAP_TOKENS.map(tk => (<option key={tk.value} value={tk.value}>{tk.icon} {tk.label}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.amount')}</label>
                  <input type="number" step="0.01" min="0" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                </div>

                <button onClick={handleSwap} disabled={swapLoading || !swapAmount || swapFrom === swapTo} className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {swapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownUp className="w-4 h-4" />}
                  {swapLoading ? t('finance.swapping') : t('finance.swapBtn')}
                </button>
              </div>
              {renderSteps(swapSteps)}
            </motion.div>
          )}

          {/* Bridge Tab */}
          {activeTab === 'bridge' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-lg">{t('finance.bridge')}</h2>
              </div>
              <p className="text-xs text-gray-500 mb-5">{t('finance.bridgeDesc')}</p>

              {bridgeSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4" /> {t('finance.success')}
                </div>
              )}
              {bridgeError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4 break-words">
                  <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{bridgeError}</span></div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.fromChain')}</label>
                  <select value={bridgeFrom} onChange={(e) => setBridgeFrom(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300">
                    {BRIDGE_CHAINS.map(c => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <button onClick={() => { const tmp = bridgeFrom; setBridgeFrom(bridgeTo); setBridgeTo(tmp); }} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.toChain')}</label>
                  <select value={bridgeTo} onChange={(e) => setBridgeTo(e.target.value)} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300">
                    {BRIDGE_CHAINS.map(c => (<option key={c.value} value={c.value}>{c.icon} {c.label}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.bridgeAmount')}</label>
                  <input type="number" step="0.01" min="0" value={bridgeAmount} onChange={(e) => setBridgeAmount(e.target.value)} placeholder="0.00 USDC" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                </div>

                <button onClick={handleBridge} disabled={bridgeLoading || !bridgeAmount || bridgeFrom === bridgeTo} className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {bridgeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
                  {bridgeLoading ? t('finance.bridging') : t('finance.bridgeBtn')}
                </button>
              </div>
              {renderSteps(bridgeSteps)}
            </motion.div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-5 h-5 text-green-400" />
                <h2 className="font-semibold text-lg">{t('finance.send')}</h2>
              </div>
              <p className="text-xs text-gray-500 mb-5">{t('finance.sendDesc')}</p>

              {sendSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4" /> {t('finance.success')}
                </div>
              )}
              {sendError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4 break-words">
                  <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{sendError}</span></div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.recipient')}</label>
                  <input type="text" value={sendRecipient} onChange={(e) => setSendRecipient(e.target.value)} placeholder="0x..." className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white font-mono" />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('finance.sendAmount')}</label>
                  <input type="number" step="0.01" min="0" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00 USDC" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white" />
                </div>

                <button onClick={handleSend} disabled={sendLoading || !sendAmount || !sendRecipient} className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {sendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sendLoading ? t('finance.sending') : t('finance.sendBtn')}
                </button>
              </div>
              {renderSteps(sendSteps)}
            </motion.div>
          )}

          {/* Powered by */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-600">{t('finance.poweredBy')}</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
