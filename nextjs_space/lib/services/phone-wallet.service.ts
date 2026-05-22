/**
 * Phone Wallet Service
 * Telefon numarasına bağlı cüzdan yönetimi.
 * WhatsApp'tan gelen kullanıcılar için ethers.js ile yerel cüzdan oluşturma/sorgulama.
 * Circle Developer-Controlled Wallets bağımlılığı kaldırıldı.
 */

import { prisma } from '@/lib/prisma';
import { ethers } from 'ethers';
import crypto from 'crypto';

// Simple AES-256 encryption for private keys
const ENCRYPTION_KEY = process.env.PHONE_WALLET_ENC_KEY || process.env.NEXTAUTH_SECRET || 'wishtree-default-enc-key-32chars!';

function getEncKey(): Buffer {
  // Ensure 32 bytes for AES-256
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encryptPrivateKey(privateKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncKey(), iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptPrivateKey(encryptedData: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Telefon numarası için cüzdan döner. Yoksa oluşturur.
 */
export async function getOrCreatePhoneWallet(phone: string): Promise<{
  id: string;
  phone: string;
  circleWalletId: string | null;
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

  // Create local ethers.js wallet
  const wallet = ethers.Wallet.createRandom();
  const encryptedKey = encryptPrivateKey(wallet.privateKey);

  // Save to DB
  const phoneWallet = await prisma.phoneWallet.create({
    data: {
      phone: normalizedPhone,
      walletAddress: wallet.address.toLowerCase(),
      encryptedKey,
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

/**
 * Phone wallet'ın private key'ini döner (işlem imzalama için)
 */
export async function getPhoneWalletSigner(phoneWalletId: string): Promise<ethers.Wallet | null> {
  const pw = await prisma.phoneWallet.findUnique({ where: { id: phoneWalletId } });
  if (!pw?.encryptedKey) return null;
  
  const privateKey = decryptPrivateKey(pw.encryptedKey);
  const provider = new ethers.providers.JsonRpcProvider('https://rpc.testnet.arc.network');
  return new ethers.Wallet(privateKey, provider);
}
