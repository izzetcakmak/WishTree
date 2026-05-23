'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Shield, Star, ExternalLink, Search, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import Header from '../components/header';
import { AGENT_CATEGORIES } from '@/lib/erc8004';
import { useT } from '@/lib/i18n';

interface AgentData {
  id: string;
  name: string;
  description: string;
  agentType: string;
  capabilities: string[];
  version: string;
  ownerAddress: string;
  agentTokenId: number | null;
  status: string;
  metadataURI: string | null;
  txHash: string | null;
  createdAt: string;
  _count: { feedbacks: number; validations: number };
  feedbacks: { score: number; tag: string }[];
}

export default function AgentsContent() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const t = useT();

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = agents.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || a.agentType === filterType;
    return matchSearch && matchType;
  });

  function getAvgScore(agent: AgentData) {
    if (!agent.feedbacks?.length) return null;
    const sum = agent.feedbacks.reduce((acc, f) => acc + f.score, 0);
    return Math.round(sum / agent.feedbacks.length);
  }

  function getCategoryIcon(type: string) {
    return AGENT_CATEGORIES.find((c) => c.value === type)?.icon || '\uD83E\uDD16';
  }

  function shortenAddress(addr: string) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bot className="w-8 h-8 text-accent" />
                {t('agents.title')}
              </h1>
              <p className="text-gray-400 mt-1">{t('agents.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/agents/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium transition-colors text-sm"
              >
                <Bot className="w-4 h-4" /> {t('agent.newMatchmaker')}
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={t('agents.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-accent/50"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-accent/50 text-gray-300"
            >
              <option value="">{t('agents.allTypes')}</option>
              {AGENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Example agent cards — always shown */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{t('agents.exampleBadge')}</span>
            <span className="text-[10px] text-gray-500 ml-1">— {t('agents.exampleNote')}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'Charity Agent', emoji: '💝', desc: 'Routes USDC donations to verified charity wishes. Validates recipients and distributes funds based on sentiment and urgency.', caps: ['charity', 'usdc-routing', 'verification'], type: 'matchmaker' },
              { name: 'Wish Matching Agent', emoji: '🤝', desc: 'AI-powered wish-to-donor matching. Analyzes wish content and matches with donors whose preferences align.', caps: ['nlp', 'matching', 'recommendations'], type: 'analyzer' },
              { name: 'Fraud Filter Agent', emoji: '🛡️', desc: 'Screens wishes for spam and fraud before they enter the blessing pool. Protects the ecosystem integrity.', caps: ['fraud-detection', 'nlp', 'moderation'], type: 'validator' },
            ].map((ex, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/10 opacity-70 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{ex.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-white">{ex.name}</h3>
                    <span className="text-xs text-gray-500">example</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{ex.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ex.caps.map((c) => (<span key={c} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">{c}</span>))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            {t('agents.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">{t('agents.noFound')}</h3>
            <p className="text-gray-500 mb-6">{t('agents.beFirst')}</p>
            <Link
              href="/agents/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium transition-colors"
            >
              <Bot className="w-4 h-4" /> {t('agent.newMatchmaker')}
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agent, i) => {
              const avgScore = getAvgScore(agent);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/agents/${agent.id}`} className="block">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/30 hover:bg-white/[0.07] transition-all cursor-pointer h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryIcon(agent.agentType)}</span>
                          <div>
                            <h3 className="font-semibold text-white">{agent.name}</h3>
                            <span className="text-xs text-gray-500">v{agent.version}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          agent.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                          agent.status === 'registered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {agent.status === 'active' ? t('agents.active') : agent.status === 'registered' ? t('agents.registered') : t('agents.pending')}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{agent.description}</p>

                      {agent.capabilities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {agent.capabilities.slice(0, 3).map((cap) => (
                            <span key={cap} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">{cap}</span>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded-full">+{agent.capabilities.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {shortenAddress(agent.ownerAddress)}
                        </span>
                        <div className="flex items-center gap-3">
                          {avgScore !== null && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-3 h-3 fill-current" /> {avgScore}
                            </span>
                          )}
                          <span>{agent._count.feedbacks} {agent._count.feedbacks !== 1 ? t('agents.feedbacks') : t('agents.feedback')}</span>
                        </div>
                      </div>

                      {agent.agentTokenId !== null && (
                        <div className="mt-2 text-xs text-accent/70 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Token ID: #{agent.agentTokenId}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
