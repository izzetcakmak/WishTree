export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { requestHash, requestURI, validator, txHash } = body;

    if (!requestHash || !validator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validation = await prisma.agentValidation.create({
      data: {
        agentId: params.id,
        requestHash,
        requestURI: requestURI || null,
        validator: validator.toLowerCase(),
        status: 'pending',
        txHash: txHash || null,
      },
    });

    return NextResponse.json({ validation }, { status: 201 });
  } catch (err: any) {
    console.error('POST validation error:', err);
    return NextResponse.json({ error: 'Failed to create validation' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { requestHash, response, responseTag } = body;

    if (!requestHash) {
      return NextResponse.json({ error: 'Missing requestHash' }, { status: 400 });
    }

    const validation = await prisma.agentValidation.update({
      where: { requestHash },
      data: {
        response,
        responseTag: responseTag || null,
        status: response !== undefined ? (response >= 50 ? 'verified' : 'failed') : 'pending',
      },
    });

    return NextResponse.json({ validation });
  } catch (err: any) {
    console.error('PATCH validation error:', err);
    return NextResponse.json({ error: 'Failed to update validation' }, { status: 500 });
  }
}
