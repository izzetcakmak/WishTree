export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decideAgentBless } from '@/lib/services/ai.service';
import { sendUSDC } from '@/lib/services/circle.service';
import { addBlessing } from '@/lib/services/wish.service';
import { sendWhatsApp } from '@/lib/services/twilio.service';

const INTERNAL_SECRET = process.env.INTERNAL_CRON_SECRET || '';

/**
 * POST /api/agents/tick
 * AI Agent tick handler — Aktif ajanları işler ve uygun dileklere bless yapar.
 *
 * Cron veya manuel tetikleme ile çağrılır.
 * Authorization: Bearer <INTERNAL_CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Auth kontrolü
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (INTERNAL_SECRET && token !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aktif ajanları al
    const agents = await prisma.agent.findMany({
      where: {
        status: 'active',
        walletId: { not: null },
        walletAddress: { not: null },
      },
    });

    if (agents.length === 0) {
      return NextResponse.json({ message: 'No active agents', processed: 0 });
    }

    const results: any[] = [];

    for (const agent of agents) {
      try {
        // Aylık bütçe reset kontrolü
        const now = new Date();
        if (agent.monthResetAt && now > agent.monthResetAt) {
          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              monthlySpent: 0,
              monthResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            },
          });
          agent.monthlySpent = 0;
        }

        const remainingBudget = agent.monthlyBudget - agent.monthlySpent;
        if (remainingBudget <= 0) {
          results.push({ agentId: agent.id, status: 'budget_exhausted' });
          continue;
        }

        // Henüz bless yapılmamış uygun dilekleri bul
        const criteria = (agent.criteria as Record<string, any>) || {};
        const categoryFilter = criteria.categories
          ? { category: { in: criteria.categories } }
          : {};

        const unblessedWishes = await prisma.wish.findMany({
          where: {
            ...categoryFilter,
            blessings: {
              none: { agentId: agent.id },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        for (const wish of unblessedWishes) {
          if (agent.monthlySpent >= agent.monthlyBudget) break;

          // AI kararı
          const decision = await decideAgentBless(
            criteria,
            {
              content: wish.content,
              category: wish.category,
              walletAddress: wish.walletAddress,
            },
            agent.monthlyBudget - agent.monthlySpent
          );

          if (!decision.shouldBless || decision.amount <= 0) continue;

          try {
            // Circle cüzdandan USDC gönder
            let txId = '';
            if (agent.walletId && agent.walletAddress) {
              txId = await sendUSDC(
                agent.walletId,
                wish.walletAddress,
                decision.amount.toFixed(2)
              );
            }

            // DB'ye kaydet
            await addBlessing({
              wishId: wish.id,
              blesserAddress: agent.walletAddress || '',
              amount: decision.amount,
              message: `🤖 ${agent.name} (Token #${agent.agentTokenId ?? '?'}): ${decision.reason}`,
              agentId: agent.id,
            });

            // Ajan harcamasını güncelle
            await prisma.agent.update({
              where: { id: agent.id },
              data: {
                monthlySpent: { increment: decision.amount },
                lastTickAt: new Date(),
              },
            });

            // Telefon cüzdanı sahibine WhatsApp bildirimi
            if (wish.phoneWalletId) {
              const phoneWallet = await prisma.phoneWallet.findUnique({
                where: { id: wish.phoneWalletId },
              });
              if (phoneWallet) {
                await sendWhatsApp(
                  phoneWallet.phone,
                  `🌟 ${agent.name} dileğine ${decision.amount} USDC gönderdi! Sebep: ${decision.reason}`
                ).catch(console.error);
              }
            }

            results.push({
              agentId: agent.id,
              wishId: wish.id,
              amount: decision.amount,
              reason: decision.reason,
              status: 'blessed',
            });
          } catch (blessErr: any) {
            console.error(`Agent ${agent.id} bless error for wish ${wish.id}:`, blessErr);
            results.push({
              agentId: agent.id,
              wishId: wish.id,
              status: 'error',
              error: blessErr?.message,
            });
          }
        }

        // Son tick zamanını güncelle
        await prisma.agent.update({
          where: { id: agent.id },
          data: { lastTickAt: new Date() },
        });
      } catch (agentErr: any) {
        console.error(`Agent ${agent.id} tick error:`, agentErr);
        results.push({ agentId: agent.id, status: 'error', error: agentErr?.message });
      }
    }

    return NextResponse.json({
      message: `Tick completed for ${agents.length} agent(s)`,
      results,
    });
  } catch (error: any) {
    console.error('Agent tick error:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
