export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  // Return the kit key for client-side swap operations
  const kitKey = process.env.CIRCLE_KIT_KEY || '';
  return NextResponse.json({ kitKey });
}
