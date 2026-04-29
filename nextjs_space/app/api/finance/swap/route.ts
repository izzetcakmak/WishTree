export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const CIRCLE_API_URL = 'https://api.circle.com';

export async function POST(req: NextRequest) {
  try {
    const kitKey = process.env.CIRCLE_KIT_KEY || '';
    if (!kitKey) {
      return NextResponse.json({ error: 'Kit Key not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { action, ...params } = body;

    let url = '';
    let method = 'POST';
    let fetchBody: any = undefined;

    switch (action) {
      case 'swap':
        url = `${CIRCLE_API_URL}/v1/stablecoinKits/swap`;
        fetchBody = params;
        break;
      case 'quote':
        // GET request with query params
        const qs = new URLSearchParams(params).toString();
        url = `${CIRCLE_API_URL}/v1/stablecoinKits/quote?${qs}`;
        method = 'GET';
        break;
      case 'status':
        const statusQs = new URLSearchParams(params).toString();
        url = `${CIRCLE_API_URL}/v1/stablecoinKits/swap/status?${statusQs}`;
        method = 'GET';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${kitKey}`,
      'Content-Type': 'application/json',
    };

    const fetchOpts: RequestInit = {
      method,
      headers,
      ...(fetchBody && method === 'POST' ? { body: JSON.stringify(fetchBody) } : {}),
    };

    const response = await fetch(url, fetchOpts);
    const data = await response.json();

    if (!response.ok) {
      console.error('[Swap Proxy] Circle API error:', response.status, data);
      return NextResponse.json({ error: data?.message || 'Circle API error', details: data }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Swap Proxy] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
