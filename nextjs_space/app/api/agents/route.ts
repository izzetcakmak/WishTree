export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerAgentOnChain } from '@/lib/erc8004-blockchain';

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
    const { name, description, agentType, capabilities, version, metadataURI, ownerAddress, txHash, agentTokenId, criteria, monthlyBudget } = body;

    if (!name || !description || !agentType || !ownerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isMatchmaker = agentType === 'matchmaker';

    // Build metadata URI for on-chain registration
    const agentMetadataURI = metadataURI || `wishtree://agent/${encodeURIComponent(name)}`;

    // Server-side on-chain registration via relayer for ALL agents
    let onChainTxHash = txHash || null;
    let onChainTokenId = agentTokenId ?? null;

    if (!onChainTxHash) {
      try {
        console.log(`[API] Registering agent "${name}" on-chain...`);
        const result = await registerAgentOnChain(agentMetadataURI);
        onChainTxHash = result.txHash;
        onChainTokenId = result.agentTokenId;
        console.log(`[API] Agent registered: tokenId=${result.agentTokenId}, tx=${result.txHash}`);
      } catch (regErr: any) {
        console.error('[API] On-chain registration failed:', regErr?.message);
        // Still create the agent in DB but mark as pending
      }
    }

    const initialStatus = onChainTxHash ? 'registered' : 'pending';

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        agentType,
        capabilities: capabilities || [],
        version: version || '1.0.0',
        metadataURI: agentMetadataURI,
        ownerAddress: ownerAddress.toLowerCase(),
        txHash: onChainTxHash,
        agentTokenId: onChainTokenId,
        status: isMatchmaker && onChainTxHash ? 'active' : initialStatus,
        // Matchmaker agent fields
        criteria: criteria || null,
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : 0,
        monthlySpent: 0,
        monthResetAt: isMatchmaker ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) : null,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/agents error:', err);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
