export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        feedbacks: { orderBy: { createdAt: 'desc' as const } },
        validations: { orderBy: { createdAt: 'desc' as const } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (err: any) {
    console.error('GET /api/agents/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: body,
    });
    return NextResponse.json({ agent });
  } catch (err: any) {
    console.error('PATCH /api/agents/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}
