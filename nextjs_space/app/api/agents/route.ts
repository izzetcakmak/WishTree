export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const where = owner ? { ownerAddress: owner.toLowerCase() } : {};

    const agents = await prisma.agent.findMany({
      where,
      include: {
        feedbacks: { orderBy: { createdAt: 'desc' as const }, take: 10 },
        validations: { orderBy: { createdAt: 'desc' as const }, take: 5 },
        _count: { select: { feedbacks: true, validations: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ agents });
  } catch (err: any) {
    console.error('GET /api/agents error:', err);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, agentType, capabilities, version, metadataURI, ownerAddress, txHash, agentTokenId } = body;

    if (!name || !description || !agentType || !ownerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        agentType,
        capabilities: capabilities || [],
        version: version || '1.0.0',
        metadataURI: metadataURI || null,
        ownerAddress: ownerAddress.toLowerCase(),
        txHash: txHash || null,
        agentTokenId: agentTokenId ?? null,
        status: txHash ? 'registered' : 'pending',
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/agents error:', err);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
