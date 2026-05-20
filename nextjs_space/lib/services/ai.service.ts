/**
 * AI Service — Abacus AI LLM API
 * Dilek analizi, kategori tespiti, ajan eşleştirme kararı.
 * Mevcut Abacus AI API key kullanılır (ABACUSAI_API_KEY).
 */

const LLM_ENDPOINT = 'https://api.abacus.ai/api/v1/chat/completions';
const LLM_MODEL = 'claude-3-5-sonnet-20241022';

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ABACUSAI_API_KEY;
  if (!apiKey) throw new Error('ABACUSAI_API_KEY not configured');

  const res = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LLM API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

export interface WishAnalysisResult {
  category: string;
  sentiment: string;
  score: number;
  summary: string;
  language: string;
}

/**
 * Dileği analiz eder: kategori, duygu, dil tespiti
 */
export async function analyzeWish(wishContent: string): Promise<WishAnalysisResult> {
  const systemPrompt = `Sen bir dilek analiz sistemisin. Kullanıcının gönderdiği dileği analiz et.
Yanıtı sadece JSON formatında ver, başka metin ekleme:
{
  "category": "health" | "education" | "family" | "career" | "money" | "love" | "travel" | "spiritual" | "other",
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0.0 - 1.0,
  "summary": "kısa özet (max 100 karakter)",
  "language": "tr" | "en" | "other"
}`;

  const raw = await callLLM(systemPrompt, wishContent);

  try {
    // JSON bloğunu çıkart
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      category: 'other',
      sentiment: 'neutral',
      score: 0.5,
      summary: wishContent.slice(0, 100),
      language: 'other',
    };
  }
}

export interface AgentMatchDecision {
  shouldBless: boolean;
  amount: number;
  reason: string;
}

/**
 * AI ajanının bir dileğe bless yapıp yapmamasına karar verir
 */
export async function decideAgentBless(
  agentCriteria: Record<string, any>,
  wish: { content: string; category: string | null; walletAddress: string },
  remainingBudget: number
): Promise<AgentMatchDecision> {
  const systemPrompt = `Sen bir AI yardım ajanısın. Verilen kriterlere göre bir dileğe USDC yardımı yapıp yapmamaya karar ver.
Kriterleri:
${JSON.stringify(agentCriteria, null, 2)}

Kalan aylık bütçe: ${remainingBudget} USDC

Yanıtı sadece JSON formatında ver:
{
  "shouldBless": true/false,
  "amount": number (USDC, max ${Math.min(agentCriteria.maxPerWish || 10, remainingBudget)}),
  "reason": "kısa açıklama"
}`;

  const userPrompt = `Dilek: "${wish.content}"
Kategori: ${wish.category || 'bilinmiyor'}
Cüzdan: ${wish.walletAddress}`;

  const raw = await callLLM(systemPrompt, userPrompt);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      shouldBless: Boolean(parsed.shouldBless),
      amount: Math.min(Number(parsed.amount) || 0, remainingBudget),
      reason: String(parsed.reason || ''),
    };
  } catch {
    return { shouldBless: false, amount: 0, reason: 'AI karar veremedi' };
  }
}

/**
 * WhatsApp dil tespiti
 */
export async function detectLanguage(text: string): Promise<'tr' | 'en'> {
  const raw = await callLLM(
    'Detect the language of the following text. Reply with only "tr" for Turkish or "en" for English.',
    text
  );
  const cleaned = raw.trim().toLowerCase();
  return cleaned.includes('tr') ? 'tr' : 'en';
}
