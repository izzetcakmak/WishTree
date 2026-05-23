'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Star, Shield, MessageSquare, CheckCircle2, XCircle, Loader2, ExternalLink, Send, AlertCircle } from 'lucide-react';
import Header from '../../components/header';
import { AGENT_CATEGORIES, ERC8004_CONTRACTS } from '@/lib/erc8004';
import { giveFeedback, requestValidation, getValidationStatus } from '@/lib/erc8004-blockchain';
import { connectWallet, checkNetwork, switchToArcTestnet } from '@/lib/blockchain';
import { useT } from '@/lib/i18n';

interface AgentDetail {
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
  feedbacks: { id: string; score: number; tag: string; comment: string | null; validator: string; txHash: string | null; createdAt: string }[];
  validations: { id: string; requestHash: string; validator: string; response: number | null; responseTag: string | null; status: string; createdAt: string }[];
}

export default function AgentDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const t = useT();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'validation'>('overview');

  // Feedback form
  const [fbScore, setFbScore] = useState(80);
  const [fbTag, setFbTag] = useState('good_performance');
  const [fbComment, setFbComment] = useState('');
  const [fbLoading, setFbLoading] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);
  const [fbError, setFbError] = useState('');

  // Validation form
  const [valAddress, setValAddress] = useState('');
  const [valLoading, setValLoading] = useState(false);
  const [valSuccess, setValSuccess] = useState(false);
  const [valError, setValError] = useState('');

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${id}`);
      const data = await res.json();
      if (data.agent) setAgent(data.agent);
    } catch (err) {
      console.error('Failed to fetch agent:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAgent();
  }, [id, fetchAgent]);

  async function ensureWallet() {
    const addr = await connectWallet();
    if (!addr) throw new Error(t('agentDetail.connectWallet'));
    const onArc = await checkNetwork();
    if (!onArc) {
      const switched = await switchToArcTestnet();
      if (!switched) throw new Error(t('agentDetail.switchNetwork'));
    }
    return addr;
  }

  async function handleFeedback() {
    if (!agent?.agentTokenId) { setFbError(t('agentDetail.noTokenId')); return; }
    setFbLoading(true); setFbError(''); setFbSuccess(false);
    try {
      const addr = await ensureWallet();
      if (addr.toLowerCase() === agent.ownerAddress.toLowerCase()) {
        setFbError(t('agentDetail.ownerCannotFb'));
        setFbLoading(false);
        return;
      }
      const tx = await giveFeedback(agent.agentTokenId, fbScore, fbTag, fbComment);
      await tx.wait();

      await fetch(`/api/agents/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: fbScore, tag: fbTag, comment: fbComment, validator: addr, txHash: tx.hash }),
      });

      setFbSuccess(true);
      setFbComment('');
      fetchAgent();
    } catch (err: any) {
      setFbError(err?.code === 'ACTION_REJECTED' ? t('agentDetail.txRejected') : (err?.message || t('agentDetail.feedbackFailed')));
    } finally {
      setFbLoading(false);
    }
  }

  async function handleRequestValidation() {
    if (!agent?.agentTokenId) { setValError(t('agentDetail.noTokenId')); return; }
    if (!valAddress.trim()) { setValError(t('agentDetail.enterValidator')); return; }
    setValLoading(true); setValError(''); setValSuccess(false);
    try {
      await ensureWallet();
      const requestURI = `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify({ agent: agent.name, type: 'validation_request' }))))}`;
      const { tx, requestHash } = await requestValidation(valAddress, agent.agentTokenId, requestURI);
      await tx.wait();

      await fetch(`/api/agents/${id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestHash, requestURI, validator: valAddress, txHash: tx.hash }),
      });

      setValSuccess(true);
      setValAddress('');
      fetchAgent();
    } catch (err: any) {
      setValError(err?.code === 'ACTION_REJECTED' ? t('agentDetail.txRejected') : (err?.message || t('agentDetail.validationFailed')));
    } finally {
      setValLoading(false);
    }
  }

  function shortenAddr(addr: string) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  }

  function getCategoryInfo(type: string) {
    return AGENT_CATEGORIES.find((c) => c.value === type) || { icon: '\uD83E\uDD16', label: 'Other' };
  }

  function getAvgScore() {
    if (!agent?.feedbacks?.length) return null;
    return Math.round(agent.feedbacks.reduce((s, f) => s + f.score, 0) / agent.feedbacks.length);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <Header />
        <div className="text-center py-32 text-gray-400">{t('agentDetail.notFound')}</div>
      </div>
    );
  }

  const catInfo = getCategoryInfo(agent.agentType);
  const avgScore = getAvgScore();
  const fbCount = agent.feedbacks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      <main className="max-w-[900px] mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Agent Header */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl flex-shrink-0">
                {catInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agent.status === 'registered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {agent.status === 'registered' ? t('agentDetail.registered') : t('agentDetail.pending')}
                  </span>
                  <span className="text-xs text-gray-500">v{agent.version}</span>
                </div>
                <p className="text-gray-400 mt-1">{agent.description}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span className="font-mono text-xs">{shortenAddr(agent.ownerAddress)}</span>
                  </div>
                  {agent.agentTokenId !== null && (
                    <div className="flex items-center gap-1.5 text-accent">
                      <Bot className="w-4 h-4" />
                      Token #{agent.agentTokenId}
                    </div>
                  )}
                  {avgScore !== null && (
                    <div className="flex items-center gap-1.5 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      {avgScore}/100
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                    {fbCount} {fbCount !== 1 ? t('agentDetail.feedbackPlural') : t('agentDetail.feedback')}
                  </div>
                </div>

                {agent.capabilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.capabilities.map((cap) => (
                      <span key={cap} className="px-2.5 py-1 bg-accent/10 text-accent text-xs rounded-full">{cap}</span>
                    ))}
                  </div>
                )}

                {agent.txHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${agent.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent/70 hover:text-accent mt-3"
                  >
                    <ExternalLink className="w-3 h-3" /> {t('agentDetail.viewRegistration')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
            {(['overview', 'feedback', 'validation'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'overview' ? t('agentDetail.overview') : tab === 'feedback' ? t('agentDetail.reputation') : t('agentDetail.validation')}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-accent">{agent.feedbacks.length}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('agentDetail.feedbacks')}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{avgScore ?? '-'}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('agentDetail.avgScore')}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {agent.validations.filter((v) => v.status === 'verified').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t('agentDetail.verified')}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-2xl font-bold text-purple-400">{catInfo.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{t('agentDetail.type')}</div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-3">{t('agentDetail.contracts')}</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(ERC8004_CONTRACTS).map(([name, addr]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-gray-400">{name.replace('_', ' ')}</span>
                      <a
                        href={`https://testnet.arcscan.app/address/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accent/70 hover:text-accent flex items-center gap-1"
                      >
                        {shortenAddr(addr)} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feedback (Reputation) Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> {t('agentDetail.giveFeedback')}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {t('agentDetail.ownerCannot')}
                </p>

                {fbSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                    <CheckCircle2 className="w-4 h-4" /> {t('agentDetail.feedbackRecorded')}
                  </div>
                )}
                {fbError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
                    <AlertCircle className="w-4 h-4" /> {fbError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('agentDetail.score')}: {fbScore}</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fbScore}
                      onChange={(e) => setFbScore(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>0 ({t('agentDetail.poor')})</span><span>50</span><span>100 ({t('agentDetail.excellent')})</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('agentDetail.tag')}</label>
                    <select
                      value={fbTag}
                      onChange={(e) => setFbTag(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-gray-300"
                    >
                      <option value="good_performance">{t('tag.good_performance')}</option>
                      <option value="successful_trade">{t('tag.successful_trade')}</option>
                      <option value="accurate_analysis">{t('tag.accurate_analysis')}</option>
                      <option value="helpful_suggestion">{t('tag.helpful_suggestion')}</option>
                      <option value="fast_execution">{t('tag.fast_execution')}</option>
                      <option value="poor_result">{t('tag.poor_result')}</option>
                      <option value="other">{t('tag.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('agentDetail.comment')}</label>
                    <input
                      type="text"
                      value={fbComment}
                      onChange={(e) => setFbComment(e.target.value)}
                      placeholder={t('agentDetail.commentPlaceholder')}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white"
                    />
                  </div>

                  <button
                    onClick={handleFeedback}
                    disabled={fbLoading}
                    className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {fbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                    {fbLoading ? t('agentDetail.sendingFb') : t('agentDetail.submitFeedback')}
                  </button>
                </div>
              </div>

              {agent.feedbacks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">{t('agentDetail.feedbackHistory')}</h3>
                  <div className="space-y-2">
                    {agent.feedbacks.map((fb) => (
                      <div key={fb.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2">
                            <Star className={`w-4 h-4 ${fb.score >= 50 ? 'text-yellow-400 fill-current' : 'text-gray-500'}`} />
                            <span className="font-semibold">{fb.score}/100</span>
                            <span className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-gray-400">{fb.tag}</span>
                          </span>
                          <span className="text-xs text-gray-600 font-mono">{shortenAddr(fb.validator)}</span>
                        </div>
                        {fb.comment && <p className="text-sm text-gray-400 mt-1">{fb.comment}</p>}
                        {fb.txHash && (
                          <a href={`https://testnet.arcscan.app/tx/${fb.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-accent/60 hover:text-accent mt-1 inline-flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> tx
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" /> {t('agentDetail.validationTitle')}
                </h3>

                {/* Explanation box */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-4">
                  <p className="text-xs text-blue-300 mb-2 font-medium">ℹ️ {t('agentDetail.validationHowTitle')}</p>
                  <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                    <li>{t('agentDetail.validationHow1')}</li>
                    <li>{t('agentDetail.validationHow2')}</li>
                    <li>{t('agentDetail.validationHow3')}</li>
                  </ul>
                </div>

                {valSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-4">
                    <CheckCircle2 className="w-4 h-4" /> {t('agentDetail.validationSent')}
                  </div>
                )}
                {valError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
                    <AlertCircle className="w-4 h-4" /> {valError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('agentDetail.validatorAddress')}</label>
                    <input
                      type="text"
                      value={valAddress}
                      onChange={(e) => setValAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none text-white font-mono"
                    />
                    <p className="text-xs text-gray-600 mt-1.5">
                      {t('agentDetail.validatorHelp')}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const addr = await connectWallet();
                          if (addr) setValAddress(addr);
                        } catch {}
                      }}
                      className="mt-2 text-xs text-accent hover:text-accent/80 transition-colors underline underline-offset-2"
                    >
                      {t('agentDetail.useMyWallet')}
                    </button>
                  </div>
                  <button
                    onClick={handleRequestValidation}
                    disabled={valLoading || !valAddress.trim()}
                    className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {valLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {valLoading ? t('agentDetail.requestingSending') : t('agentDetail.requestValidation')}
                  </button>
                </div>
              </div>

              {agent.validations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">{t('agentDetail.validationHistory')}</h3>
                  <div className="space-y-2">
                    {agent.validations.map((val) => (
                      <div key={val.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {val.status === 'verified' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : val.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-yellow-400" />
                            )}
                            <span className={`text-sm font-medium ${
                              val.status === 'verified' ? 'text-green-400' : val.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {val.status === 'verified' ? t('agentDetail.verified') : val.status === 'failed' ? t('agentDetail.failedStatus') : t('agentDetail.pendingStatus')}
                            </span>
                            {val.responseTag && <span className="text-xs text-gray-500">({val.responseTag})</span>}
                          </div>
                          <span className="text-xs text-gray-600 font-mono">{shortenAddr(val.validator)}</span>
                        </div>
                        {val.response !== null && (
                          <div className="text-xs text-gray-500 mt-1">{t('agentDetail.response')}: {val.response} ({val.response >= 50 ? t('agentDetail.passed') : t('agentDetail.failedStatus')})</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
