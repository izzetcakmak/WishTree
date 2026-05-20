export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wishes/[id]/blessings
 * Bir wish'e yapılan blessing listesini döner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const wishId = params.id;

    const blessings = await prisma.blessing.findMany({
      where: { wishId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const wish = await prisma.wish.findUnique({
      where: { id: wishId },
      select: { totalBlessed: true, claimed: true },
    });

    return NextResponse.json({
      blessings,
      totalBlessed: wish?.totalBlessed || 0,
      claimed: wish?.claimed || false,
    });
  } catch (error: any) {
    console.error('GET blessings error:', error);
    return NextResponse.json({ blessings: [], totalBlessed: 0 }, { status: 200 });
  }
}
