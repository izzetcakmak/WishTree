export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Transparent proxy for Circle Stablecoin Kit API calls.
 * The client-side Circle SDK tries to call api.circle.com directly,
 * which gets blocked by CORS. This proxy routes those calls through
 * our server to avoid CORS issues.
 */
export async function POST(req: NextRequest) {
  try {
    const { targetUrl, method, body, headers: clientHeaders } = await req.json();

    if (!targetUrl || (!targetUrl.includes('api.circle.com') && !targetUrl.includes('iris-api.circle.com'))) {
      return NextResponse.json({ error: 'Invalid target URL' }, { status: 400 });
    }

    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward authorization header
    if (clientHeaders?.Authorization) {
      fetchHeaders['Authorization'] = clientHeaders.Authorization;
    } else if (clientHeaders?.authorization) {
      fetchHeaders['Authorization'] = clientHeaders.authorization;
    }

    const fetchOpts: RequestInit = {
      method: method || 'GET',
      headers: fetchHeaders,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    console.log('[Swap Proxy] Forwarding:', method, targetUrl);
    const response = await fetch(targetUrl, fetchOpts);
    const data = await response.json();

    if (!response.ok) {
      console.error('[Swap Proxy] Circle API error:', response.status, JSON.stringify(data).slice(0, 500));
    }

    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error('[Swap Proxy] Error:', err?.message);
    return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 });
  }
}
