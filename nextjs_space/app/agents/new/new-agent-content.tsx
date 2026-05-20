'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Loader2, CheckCircle2, AlertCircle, Sparkles, DollarSign, ArrowLeft } from 'lucide-react';
import Header from '../../components/header';
import { connectWallet, switchToArcTestnet } from '@/lib/blockchain';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'health', label: { tr: 'Sağlık', en: 'Health' }, emoji: '🏥' },
  { value: 'education', label: { tr: 'Eğitim', en: 'Education' }, emoji: '🎓' },
  { value: 'family', label: { tr: 'Aile', en: 'Family' }, emoji: '👨\u200d👩\u200d👧' },
  { value: 'career', label: { tr: 'Kariyer', en: 'Career' }, emoji: '💼' },
  { value: 'other', label: { tr: 'Genel İyilik', en: 'General Good' }, emoji: '✨' },
];

type Step = 'form' | 'creating' | 'done' | 'error';

export default function NewAgentContent() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [agentId, setAgentId] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    categories: [] as string[],
    monthlyBudget: 100,
    maxPerWish: 10,
  });

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleCreate = async () => {
    setError('');
    if (!form.name || !form.description) {
      setError(t('agent.nameRequired'));
      return;
    }
    if (form.monthlyBudget <= 0) {
      setError(t('agent.budgetRequired'));
      return;
    }

    setStep('creating');

    try {
      const walletAddress = await connectWallet();
      if (!walletAddress) throw new Error('Wallet connection failed');
      await switchToArcTestnet();

      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          agentType: 'matchmaker',
          capabilities: ['auto-bless', 'ai-matching'],
          ownerAddress: walletAddress,
          criteria: {
            categories: form.categories.length > 0 ? form.categories : undefined,
            maxPerWish: form.maxPerWish,
          },
          monthlyBudget: form.monthlyBudget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Failed to create agent');
      }

      const data = await res.json();
      setAgentId(data?.agent?.id || '');
      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/agents" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('agent.backToAgents')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t('agent.createTitle')}</h1>
              <p className="text-sm text-gray-400">{t('agent.createSubtitle')}</p>
            </div>
          </div>

          {step === 'form' && (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('agent.name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('agent.namePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:border-accent/50 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('agent.description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('agent.descPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:border-accent/50 focus:outline-none resize-none"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('agent.categories')}</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                        form.categories.includes(cat.value)
                          ? 'bg-accent/20 text-accent border border-accent/30'
                          : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label[t('_lang') as 'tr' | 'en'] || cat.label.en}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('agent.categoriesHint')}</p>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    <DollarSign className="w-3 h-3 inline" /> {t('agent.monthlyBudget')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.monthlyBudget}
                    onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:border-accent/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('agent.maxPerWish')}
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.maxPerWish}
                    onChange={(e) => setForm({ ...form, maxPerWish: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:border-accent/50 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                {t('agent.createButton')}
              </button>
            </div>
          )}

          {step === 'creating' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <p className="text-sm text-white/80">{t('agent.creating')}</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
                <CheckCircle2 className="w-14 h-14 text-green-400" />
              </motion.div>
              <p className="text-lg font-bold text-white">{t('agent.created')}</p>
              <p className="text-sm text-gray-400">{t('agent.createdInfo')}</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => router.push(`/agents/${agentId}`)}
                  className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90"
                >
                  {t('agent.viewAgent')}
                </button>
                <button
                  onClick={() => router.push('/agents')}
                  className="px-5 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20"
                >
                  {t('agent.backToAgents')}
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <AlertCircle className="w-14 h-14 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="mt-2 px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20"
              >
                {t('bless.retry')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
