export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addBlessing } from '@/lib/services/wish.service';

/**
 * POST /api/gateway/webhook
 * Circle Gateway cross-chain deposit settlement handler.
 * Gateway deposit tamamlandığında Circle tarafından tetiklenir.
 *
 * Beklenen body (Circle Gateway notification):
 * {
 *   depositAddress: string,
 *   amount: string,
 *   sourceChain: string,
 *   status: "complete" | "pending" | "failed",
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { depositAddress, amount, sourceChain, status } = body;

    console.log('[Gateway Webhook] Received:', { depositAddress, amount, sourceChain, status });

    if (status !== 'complete') {
      // Henüz tamamlanmamış
      if (depositAddress) {
        await prisma.gatewayDeposit.updateMany({
          where: { depositAddress },
          data: { status: status || 'pending' },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Deposit tamamlandı — DB'den eşleşen kaydı bul
    const deposit = await prisma.gatewayDeposit.findFirst({
      where: { depositAddress, status: 'pending' },
    });

    if (!deposit) {
      console.warn('[Gateway Webhook] No matching deposit found for:', depositAddress);
      return NextResponse.json({ ok: true });
    }

    // Blessing oluştur
    const blessing = await addBlessing({
      wishId: deposit.wishId,
      blesserAddress: deposit.blesserAddress,
      amount: deposit.amount,
      chainSource: deposit.sourceChain,
      txHash: undefined, // Gateway tx hash ayrıca gelir
    });

    // Deposit'i güncelle
    await prisma.gatewayDeposit.update({
      where: { id: deposit.id },
      data: {
        status: 'complete',
        blessingId: blessing.id,
      },
    });

    console.log('[Gateway Webhook] Blessing created:', blessing.id);
    return NextResponse.json({ ok: true, blessingId: blessing.id });
  } catch (error: any) {
    console.error('[Gateway Webhook] Error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
