export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const wishes = await prisma.wish.findMany({
      include: { analysis: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(wishes ?? []);
  } catch (error: any) {
    console.error('Get wishes error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishId, tokenId } = body ?? {};
    if (!wishId || typeof tokenId !== 'number') {
      return NextResponse.json({ error: 'wishId and tokenId required' }, { status: 400 });
    }
    const wish = await prisma.wish.update({
      where: { id: wishId },
      data: { tokenId },
    });
    return NextResponse.json({ id: wish.id, tokenId: wish.tokenId });
  } catch (error: any) {
    console.error('Update wish tokenId error:', error);
    return NextResponse.json({ error: error?.message ?? 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, txHash, walletAddress, tokenId, analysis } = body ?? {};
    if (!content || !walletAddress) {
      return NextResponse.json({ error: 'Content and wallet address required' }, { status: 400 });
    }
    const wish = await prisma.wish.create({
      data: {
        content,
        txHash: txHash ?? null,
        walletAddress,
        tokenId: tokenId ?? null,
        ...(analysis ? {
          analysis: {
            create: {
              sentiment: analysis?.sentiment ?? 'neutral',
              category: analysis?.category ?? 'other',
              score: analysis?.score ?? 0.5,
            },
          },
        } : {}),
      },
      include: { analysis: true },
    });
    return NextResponse.json(wish);
  } catch (error: any) {
    console.error('Create wish error:', error);
    return NextResponse.json({ error: error?.message ?? 'Internal error' }, { status: 500 });
  }
}
