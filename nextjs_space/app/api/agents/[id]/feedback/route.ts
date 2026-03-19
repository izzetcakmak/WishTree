export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { score, tag, comment, validator, txHash } = body;

    if (score === undefined || !tag || !validator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feedback = await prisma.agentFeedback.create({
      data: {
        agentId: params.id,
        score,
        tag,
        comment: comment || null,
        validator: validator.toLowerCase(),
        txHash: txHash || null,
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (err: any) {
    console.error('POST feedback error:', err);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
