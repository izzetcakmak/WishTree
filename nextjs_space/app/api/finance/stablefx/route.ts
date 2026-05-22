export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// StableFX API base (sandbox/testnet)
const STABLEFX_API = 'https://api-sandbox.circle.com/v1/exchange/stablefx';

function getApiKey() {
  // Use CIRCLE_API_KEY for StableFX (TEST_API_KEY for testnet)
  return process.env.CIRCLE_API_KEY || '';
}

async function sfxFetch(url: string, method: string, body?: any) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('StableFX API key not configured');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const opts: RequestInit = { method, headers };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }

  console.log(`[StableFX] ${method} ${url}`);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[StableFX] API error:', res.status, data);
    return { error: true, status: res.status, data };
  }
  return { error: false, status: res.status, data };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      // 1. Request a quote
      case 'quote': {
        const { fromCurrency, fromAmount, toCurrency, toAmount, tenor } = params;
        const quoteBody: any = {
          from: { currency: fromCurrency },
          to: { currency: toCurrency },
          tenor: tenor || 'instant',
        };
        if (fromAmount) quoteBody.from.amount = fromAmount;
        if (toAmount) quoteBody.to.amount = toAmount;

        const result = await sfxFetch(`${STABLEFX_API}/quotes`, 'POST', quoteBody);
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'Quote failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      // 2. Create trade (accept quote)
      case 'trade': {
        const { quoteId, idempotencyKey } = params;
        const result = await sfxFetch(`${STABLEFX_API}/trades`, 'POST', {
          quoteId,
          idempotencyKey: idempotencyKey || crypto.randomUUID(),
        });
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'Trade creation failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      // 3. Get presign data for trade intent
      case 'presign': {
        const { tradeId, recipientAddress } = params;
        const url = `${STABLEFX_API}/signatures/presign/taker/${tradeId}?recipientAddress=${encodeURIComponent(recipientAddress)}`;
        const result = await sfxFetch(url, 'GET');
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'Presign failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      // 4. Submit trade signature
      case 'signature': {
        const { signature: sigPayload } = params;
        const result = await sfxFetch(`${STABLEFX_API}/signatures`, 'POST', sigPayload);
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'Signature submission failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      // 5. Get funding presign data
      case 'fundingPresign': {
        const { contractTradeIds } = params;
        const result = await sfxFetch(`${STABLEFX_API}/signatures/funding/presign`, 'POST', {
          contractTradeIds,
          type: 'taker',
        });
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'Funding presign failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      // 6. Get trade status
      case 'status': {
        const { tradeId } = params;
        const result = await sfxFetch(`${STABLEFX_API}/trades/${tradeId}`, 'GET');
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'Status check failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      // 7. List trades
      case 'list': {
        const qs = new URLSearchParams();
        if (params.type) qs.set('type', params.type);
        if (params.status) qs.set('status', params.status);
        if (params.pageSize) qs.set('pageSize', params.pageSize);
        const result = await sfxFetch(`${STABLEFX_API}/trades?${qs.toString()}`, 'GET');
        if (result.error) {
          return NextResponse.json({ error: result.data?.message || 'List failed', details: result.data }, { status: result.status });
        }
        return NextResponse.json(result.data);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[StableFX] Server error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
