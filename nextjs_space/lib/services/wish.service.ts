/**
 * Wish Service — Dilek oluşturma, listeleme, blessing yönetimi
 * WhatsApp ve web akışından gelen dilekler için ortak servis.
 */

import { prisma } from '@/lib/prisma';
import { analyzeWish } from './ai.service';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, ARC_TESTNET } from '@/lib/contract';

const getServerProvider = () => {
  return new ethers.providers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
};

/**
 * NFT olarak dilek mint eder (relayer cüzdanı üzerinden)
 * Relayer private key gerekli: RELAYER_PRIVATE_KEY
 */
export async function mintWishNFT(
  wishContent: string,
  ownerAddress: string
): Promise<{ txHash: string; tokenId: number } | null> {
  try {
    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerKey) {
      console.warn('RELAYER_PRIVATE_KEY not set, skipping NFT mint');
      return null;
    }

    const provider = getServerProvider();
    const wallet = new ethers.Wallet(relayerKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // makeAWish fonksiyonu ile mint
    const tx = await contract.makeAWish(wishContent, {
      value: ethers.utils.parseEther('0.01'),
    });
    const receipt = await tx.wait();

    // Token ID'yi totalSupply'dan hesapla
    const totalSupply = await contract.totalSupply();
    const tokenId = totalSupply.toNumber();

    return { txHash: receipt.transactionHash, tokenId };
  } catch (error) {
    console.error('mintWishNFT error:', error);
    return null;
  }
}

/**
 * Dilek oluşturur (DB + opsiyonel NFT mint)
 */
export async function createWish(params: {
  content: string;
  walletAddress: string;
  phoneWalletId?: string;
  skipMint?: boolean;
}): Promise<{
  wish: any;
  analysis: any;
  nftResult: { txHash: string; tokenId: number } | null;
}> {
  // AI analiz
  const analysis = await analyzeWish(params.content).catch(() => ({
    category: 'other',
    sentiment: 'neutral',
    score: 0.5,
    summary: params.content.slice(0, 100),
    language: 'other' as const,
  }));

  // NFT mint (opsiyonel)
  let nftResult = null;
  if (!params.skipMint) {
    nftResult = await mintWishNFT(params.content, params.walletAddress);
  }

  // DB kaydet
  const wish = await prisma.wish.create({
    data: {
      content: params.content,
      walletAddress: params.walletAddress,
      txHash: nftResult?.txHash || null,
      tokenId: nftResult?.tokenId || null,
      category: analysis.category,
      phoneWalletId: params.phoneWalletId || null,
      analysis: {
        create: {
          sentiment: analysis.sentiment,
          category: analysis.category,
          score: analysis.score,
        },
      },
    },
    include: { analysis: true },
  });

  return { wish, analysis, nftResult };
}

/**
 * Dileğe blessing ekler (DB)
 */
export async function addBlessing(params: {
  wishId: string;
  blesserAddress: string;
  amount: number;
  message?: string;
  txHash?: string;
  chainSource?: string;
  agentId?: string;
}) {
  const blessing = await prisma.blessing.create({
    data: {
      wishId: params.wishId,
      blesserAddress: params.blesserAddress,
      amount: params.amount,
      message: params.message || null,
      txHash: params.txHash || null,
      chainSource: params.chainSource || 'arc',
      agentId: params.agentId || null,
    },
  });

  // Toplam blessing güncelle
  await prisma.wish.update({
    where: { id: params.wishId },
    data: {
      totalBlessed: { increment: params.amount },
    },
  });

  return blessing;
}

/**
 * Bir wish'in blessing listesini getirir
 */
export async function getWishBlessings(wishId: string) {
  return prisma.blessing.findMany({
    where: { wishId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Wish claim durumunu günceller
 */
export async function markWishClaimed(wishId: string) {
  return prisma.wish.update({
    where: { id: wishId },
    data: {
      claimed: true,
      claimedAt: new Date(),
    },
  });
}
