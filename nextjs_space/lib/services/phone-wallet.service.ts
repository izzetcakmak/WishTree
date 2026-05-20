/**
 * Phone Wallet Service
 * Telefon numarasına bağlı Circle cüzdan yönetimi.
 * WhatsApp'tan gelen kullanıcılar için cüzdan oluşturma/sorgulama.
 */

import { prisma } from '@/lib/prisma';
import { createWallet } from './circle.service';

/**
 * Telefon numarası için cüzdan döner. Yoksa oluşturur.
 */
export async function getOrCreatePhoneWallet(phone: string): Promise<{
  id: string;
  phone: string;
  circleWalletId: string;
  walletAddress: string;
  isNew: boolean;
}> {
  // Normalize phone
  const normalizedPhone = phone.replace('whatsapp:', '').trim();

  // Check DB
  const existing = await prisma.phoneWallet.findUnique({
    where: { phone: normalizedPhone },
  });

  if (existing) {
    return { ...existing, isNew: false };
  }

  // Create Circle wallet
  const idempotencyKey = `phone-wallet-${normalizedPhone}-${Date.now()}`;
  const { walletId, address } = await createWallet(idempotencyKey);

  // Save to DB
  const phoneWallet = await prisma.phoneWallet.create({
    data: {
      phone: normalizedPhone,
      circleWalletId: walletId,
      walletAddress: address,
    },
  });

  return { ...phoneWallet, isNew: true };
}

/**
 * Telefon numarasından cüzdan adresini sorgular
 */
export async function getPhoneWalletByPhone(phone: string) {
  const normalizedPhone = phone.replace('whatsapp:', '').trim();
  return prisma.phoneWallet.findUnique({
    where: { phone: normalizedPhone },
  });
}

/**
 * Cüzdan adresinden phone wallet sorgular
 */
export async function getPhoneWalletByAddress(address: string) {
  return prisma.phoneWallet.findUnique({
    where: { walletAddress: address.toLowerCase() },
  });
}
