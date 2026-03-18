export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const wishes = body?.wishes ?? [];

    if (!wishes?.length) {
      return new Response(JSON.stringify({ error: 'No wishes provided' }), { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const wishList = (wishes ?? []).slice(0, 50).map((w: string, i: number) => `${i + 1}. ${w}`).join('\n');

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
            content: 'You are a wish analyst. Analyze a collection of wishes and provide an insightful summary. Return JSON only.',
          },
          {
            role: 'user',
            content: `Analyze these ${wishes?.length ?? 0} wishes and provide a summary:\n\n${wishList}\n\nRespond in this exact JSON format:\n{"totalWishes": ${wishes?.length ?? 0}, "topThemes": ["theme1", "theme2", "theme3"], "overallMood": "positive/negative/mixed", "moodScore": 0.8, "summary": "A brief paragraph summarizing the wishes...", "interestingInsight": "One interesting observation..."}\nRespond with raw JSON only.`,
          },
        ],
        stream: true,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response?.ok) {
      return new Response(JSON.stringify({ error: 'LLM API error' }), { status: 500 });
    }

    const reader = response?.body?.getReader();
    if (!reader) return new Response(JSON.stringify({ error: 'No stream' }), { status: 500 });

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
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
                  } catch {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: { summary: buffer, topThemes: [], overallMood: 'mixed', moodScore: 0.5 } })}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Analyzing wishes...' })}\n\n`));
                } catch {}
              }
            }
          }
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: finalResult })}\n\n`));
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', result: { summary: buffer, topThemes: [], overallMood: 'mixed', moodScore: 0.5 } })}\n\n`));
            }
          }
        } catch (error: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: error?.message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
