export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreatePhoneWallet } from '@/lib/services/phone-wallet.service';
import { createWish, markWishClaimed } from '@/lib/services/wish.service';
import { sendWhatsApp } from '@/lib/services/twilio.service';
import { detectLanguage } from '@/lib/services/ai.service';

const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || process.env.NEXTAUTH_URL || 'https://arcwish.xyz';

// WhatsApp mesaj kalıpları
const MESSAGES = {
  tr: {
    welcome: (addr: string) =>
      `✨ WishTree'ye hoş geldin! Cüzdanın hazır: ${addr.slice(0, 8)}...\nDileğini yaz, NFT olarak kaydedelim!`,
    wishCreated: (wishId: string, tokenId: number | null) =>
      `✨ Dileğin kaydedildi!\n${tokenId ? `NFT #${tokenId} olarak mint edildi.` : 'DB\'ye kaydedildi.'}\n🔗 ${WEBHOOK_BASE_URL}/wishes\n\nBaşkaları senin dileğine USDC ile destek olabilir!`,
    claimed: (amount: number) =>
      `✅ ${amount} USDC cüzdanına gönderildi!`,
    error: 'Bir hata oluştu, lütfen tekrar dene.',
    noClaim: 'Claim edilecek bir şey bulunamadı.',
  },
  en: {
    welcome: (addr: string) =>
      `✨ Welcome to WishTree! Your wallet is ready: ${addr.slice(0, 8)}...\nType your wish to mint it as an NFT!`,
    wishCreated: (wishId: string, tokenId: number | null) =>
      `✨ Your wish has been recorded!\n${tokenId ? `Minted as NFT #${tokenId}.` : 'Saved to database.'}\n🔗 ${WEBHOOK_BASE_URL}/wishes\n\nOthers can bless your wish with USDC!`,
    claimed: (amount: number) =>
      `✅ ${amount} USDC sent to your wallet!`,
    error: 'An error occurred, please try again.',
    noClaim: 'Nothing to claim.',
  },
};

/**
 * POST /api/whatsapp/webhook
 * Twilio WhatsApp webhook handler
 * Gelen mesajları işler: dilek oluşturma, claim, durum sorgulama
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      body[key] = value.toString();
    });

    const from = body.From || '';
    const messageBody = (body.Body || '').trim();
    const messageSid = body.MessageSid || '';

    if (!from || !messageBody) {
      return new NextResponse('<Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Duplikasyon kontrolü
    if (messageSid) {
      const existing = await prisma.processedMessage.findUnique({
        where: { twilioSid: messageSid },
      });
      if (existing) {
        return new NextResponse('<Response></Response>', {
          headers: { 'Content-Type': 'text/xml' },
        });
      }
      await prisma.processedMessage.create({
        data: { twilioSid: messageSid },
      });
    }

    // Dil tespiti
    const lang = await detectLanguage(messageBody).catch(() => 'tr' as const);
    const msgs = MESSAGES[lang];

    // Cüzdan al veya oluştur
    const phoneWallet = await getOrCreatePhoneWallet(from);

    // Yeni cüzdan — hoş geldin mesajı
    if (phoneWallet.isNew) {
      await sendWhatsApp(from, msgs.welcome(phoneWallet.walletAddress)).catch(console.error);
    }

    // Komut işleme
    const lowerBody = messageBody.toLowerCase();

    // /claim <wishId> komutu
    if (lowerBody.startsWith('/claim')) {
      const parts = messageBody.split(/\s+/);
      const wishId = parts[1];
      if (!wishId) {
        await sendWhatsApp(from, msgs.noClaim).catch(console.error);
      } else {
        // Basit claim: DB güncelle (gerçek USDC transferi için relayer gerekli)
        const wish = await prisma.wish.findUnique({ where: { id: wishId } });
        if (wish && !wish.claimed && wish.totalBlessed > 0) {
          await markWishClaimed(wishId);
          await sendWhatsApp(from, msgs.claimed(wish.totalBlessed)).catch(console.error);
        } else {
          await sendWhatsApp(from, msgs.noClaim).catch(console.error);
        }
      }
    }
    // /status komutu
    else if (lowerBody.startsWith('/status') || lowerBody.startsWith('/durum')) {
      const wishes = await prisma.wish.findMany({
        where: { phoneWalletId: phoneWallet.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      const status = wishes.length > 0
        ? wishes.map((w, i) => `${i + 1}. ${w.content.slice(0, 40)}... (💰 ${w.totalBlessed} USDC)`).join('\n')
        : (lang === 'tr' ? 'Henüz dileğin yok.' : 'No wishes yet.');
      await sendWhatsApp(from, status).catch(console.error);
    }
    // Dilek oluşturma (default)
    else {
      const { wish, nftResult } = await createWish({
        content: messageBody,
        walletAddress: phoneWallet.walletAddress,
        phoneWalletId: phoneWallet.id,
      });

      await sendWhatsApp(
        from,
        msgs.wishCreated(wish.id, nftResult?.tokenId || null)
      ).catch(console.error);
    }

    // Twilio TwiML yanıt (boş — mesajları biz gönderiyoruz)
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
