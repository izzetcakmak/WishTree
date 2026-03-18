export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const wish = body?.wish ?? '';
    if (!wish) {
      return new Response(JSON.stringify({ error: 'Wish is required' }), { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a wish analyzer. Analyze the given wish and return JSON with: sentiment (positive/negative/neutral), category (love/career/health/money/family/education/travel/spiritual/other), score (0-1 confidence), and a brief interpretation (1-2 sentences). Respond with raw JSON only.',
          },
          {
            role: 'user',
            content: `Analyze this wish: "${wish}"\n\nRespond in this exact JSON format:\n{"sentiment": "positive", "category": "love", "score": 0.9, "interpretation": "A heartfelt wish about..."}`,
          },
        ],
        stream: true,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response?.ok) {
      const errText = await response?.text?.();
      return new Response(JSON.stringify({ error: `LLM API error: ${errText}` }), { status: 500 });
    }

    const reader = response?.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response stream' }), { status: 500 });
    }
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines?.pop() ?? '';
            for (const line of (lines ?? [])) {
              if (line?.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer);
                    const finalData = JSON.stringify({ status: 'completed', result: finalResult });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: { sentiment: 'neutral', category: 'other', score: 0.5, interpretation: buffer } })}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Analyzing wish...' })}\n\n`));
                } catch {}
              }
            }
          }
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: { sentiment: 'neutral', category: 'other', score: 0.5, interpretation: buffer } })}\n\n`));
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: error?.message ?? 'Stream error' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
