'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2, CheckCircle2, AlertCircle, Plus, X, ArrowRight } from 'lucide-react';
import Header from '../../components/header';
import { AGENT_CATEGORIES } from '@/lib/erc8004';
import { registerAgent, getAgentIdFromTx } from '@/lib/erc8004-blockchain';
import { connectWallet, checkNetwork, switchToArcTestnet } from '@/lib/blockchain';
import { useRouter } from 'next/navigation';

type Step = 'form' | 'signing' | 'confirming' | 'saving' | 'done' | 'error';

export default function RegisterContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [agentTokenId, setAgentTokenId] = useState<number | null>(null);
  const [agentDbId, setAgentDbId] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    agentType: 'utility',
    capabilities: [''] as string[],
    version: '1.0.0',
  });

  function updateCap(index: number, value: string) {
    const caps = [...form.capabilities];
    caps[index] = value;
    setForm({ ...form, capabilities: caps });
  }

  function addCap() {
    if (form.capabilities.length < 8) {
      setForm({ ...form, capabilities: [...form.capabilities, ''] });
    }
  }

  function removeCap(index: number) {
    const caps = form.capabilities.filter((_, i) => i !== index);
    setForm({ ...form, capabilities: caps.length ? caps : [''] });
  }

  async function handleRegister() {
    setError('');
    try {
      // 1. Connect wallet
      const addr = await connectWallet();
      if (!addr) { setError('Please connect your wallet'); return; }
      setWalletAddress(addr);

      // 2. Check network
      const onArc = await checkNetwork();
      if (!onArc) {
        const switched = await switchToArcTestnet();
        if (!switched) { setError('Please switch to Arc Testnet'); return; }
      }

      // 3. Build metadata
      const capabilities = form.capabilities.filter((c) => c.trim());
      const metadata = {
        name: form.name,
        description: form.description,
        agent_type: form.agentType,
        capabilities,
        version: form.version,
      };

      // For now, we use a data URI as metadata (in production, upload to IPFS)
      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      // 4. Sign & send transaction
      setStep('signing');
      const tx = await registerAgent(metadataURI);
      setTxHash(tx.hash);

      // 5. Wait for confirmation
      setStep('confirming');
      await tx.wait();

      // 6. Get agent token ID from receipt
      const tokenId = await getAgentIdFromTx(tx.hash);
      setAgentTokenId(tokenId);

      // 7. Save to database
      setStep('saving');
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          agentType: form.agentType,
          capabilities,
          version: form.version,
          metadataURI,
          ownerAddress: addr,
          txHash: tx.hash,
          agentTokenId: tokenId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save agent');
      setAgentDbId(data.agent.id);

      setStep('done');
    } catch (err: any) {
      console.error('Register error:', err);
      if (err?.code === 'ACTION_REJECTED' || err?.code === 4001) {
        setError('Transaction rejected by user');
      } else {
        setError(err?.message || 'Registration failed');
      }
      setStep('error');
    }
  }

  const isFormValid = form.name.trim() && form.description.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      <main className="max-w-[700px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-accent" />
            Register AI Agent
          </h1>
          <p className="text-gray-400 mb-8">Create an onchain identity for your AI agent using ERC-8004</p>

          {step === 'form' || step === 'error' ? (
            <div className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Agent Name *</label>
                <input
                  type="text"
                  placeholder="e.g. WishTree AI Analyzer"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Description *</label>
                <textarea
                  placeholder="What does your AI agent do?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Agent Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AGENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setForm({ ...form, agentType: cat.value })}
                      className={`p-3 rounded-xl border text-sm text-left transition-all ${
                        form.agentType === cat.value
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <div className="text-xs mt-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Capabilities</label>
                <div className="space-y-2">
                  {form.capabilities.map((cap, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Capability ${i + 1}`}
                        value={cap}
                        onChange={(e) => updateCap(i, e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 text-sm text-white"
                      />
                      {form.capabilities.length > 1 && (
                        <button onClick={() => removeCap(i)} className="p-2.5 text-gray-500 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {form.capabilities.length < 8 && (
                    <button onClick={addCap} className="flex items-center gap-1.5 text-sm text-accent/70 hover:text-accent transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add capability
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Version</label>
                <input
                  type="text"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-accent/50 text-white"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={!isFormValid}
                className="w-full py-3.5 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Bot className="w-5 h-5" /> Register on Arc Testnet
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-gray-500 text-center">
                Registration mints an ERC-721 identity token via the ERC-8004 IdentityRegistry.
                Gas is ~0.006 USDC-TESTNET on Arc.
              </p>
            </div>
          ) : step === 'done' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Agent Registered!</h2>
              <p className="text-gray-400 mb-4">Your AI agent now has an onchain identity on Arc Testnet</p>
              {agentTokenId !== null && (
                <p className="text-accent font-mono mb-2">Token ID: #{agentTokenId}</p>
              )}
              {txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent/70 hover:text-accent underline mb-6 inline-block"
                >
                  View on ArcScan ↗
                </a>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => router.push(`/agents/${agentDbId}`)}
                  className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
                >
                  View Agent
                </button>
                <button
                  onClick={() => router.push('/agents')}
                  className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  All Agents
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {step === 'signing' && 'Waiting for Wallet Signature...'}
                {step === 'confirming' && 'Confirming Transaction...'}
                {step === 'saving' && 'Saving Agent Data...'}
              </h2>
              <p className="text-gray-400 text-sm">
                {step === 'signing' && 'Please confirm the transaction in MetaMask'}
                {step === 'confirming' && 'Waiting for blockchain confirmation'}
                {step === 'saving' && 'Storing agent information in database'}
              </p>
              {txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent/70 hover:text-accent underline mt-4 inline-block"
                >
                  Track on ArcScan ↗
                </a>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
