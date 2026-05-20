export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { addBlessing } from '@/lib/services/wish.service';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/wishes/[id]/bless
 * On-chain bless işleminden sonra DB'ye kayıt ekler.
 * Body: { blesserAddress, amount, message?, txHash?, chainSource? }
 *
 * MOD A: Direkt Arc üzerinde (cüzdan approve + bless tx client-side yapılır)
 * MOD B: Gateway üzerinden (cross-chain deposit sonrası gateway webhook tetikler)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wishId = params.id;
    const body = await request.json();
    const { blesserAddress, amount, message, txHash, chainSource } = body;

    if (!blesserAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'blesserAddress and positive amount required' },
        { status: 400 }
      );
    }

    // Wish var mı kontrol
    const wish = await prisma.wish.findUnique({ where: { id: wishId } });
    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    const blessing = await addBlessing({
      wishId,
      blesserAddress,
      amount: Number(amount),
      message: message || undefined,
      txHash: txHash || undefined,
      chainSource: chainSource || 'arc',
    });

    return NextResponse.json({ blessing }, { status: 201 });
  } catch (error: any) {
    console.error('POST bless error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
