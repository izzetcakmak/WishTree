/**
 * Circle Developer-Controlled Wallets Service
 * Telefon kullanıcıları ve AI ajanlar için Circle cüzdan yönetimi.
 *
 * Gerekli env vars:
 *   CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_SET_ID,
 *   CIRCLE_USDC_TOKEN_ID_ARC
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

function getClient() {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!apiKey || !entitySecret) {
    throw new Error('Circle API credentials not configured (CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET)');
  }
  return initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });
}

/**
 * Yeni bir developer-controlled cüzdan oluşturur
 * @param idempotencyKey Benzersiz anahtar (dup önleme)
 */
export async function createWallet(idempotencyKey: string): Promise<{ walletId: string; address: string }> {
  const client = getClient();
  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
  if (!walletSetId) throw new Error('CIRCLE_WALLET_SET_ID not set');

  const response = await (client as any).createWallets({
    walletSetId,
    blockchains: ['ARC-TESTNET'],
    count: 1,
    idempotencyKey,
  });

  const wallet = response?.data?.wallets?.[0];
  if (!wallet) throw new Error('Circle wallet creation failed');

  return {
    walletId: wallet.id,
    address: wallet.address,
  };
}

/**
 * USDC transferi gönderir (developer-controlled cüzdandan)
 * @param fromWalletId Kaynak cüzdan ID
 * @param toAddress Hedef adres
 * @param amount USDC miktarı (string, orn: "5.00")
 */
export async function sendUSDC(
  fromWalletId: string,
  toAddress: string,
  amount: string
): Promise<string> {
  const client = getClient();
  const tokenId = process.env.CIRCLE_USDC_TOKEN_ID_ARC;
  if (!tokenId) throw new Error('CIRCLE_USDC_TOKEN_ID_ARC not set');

  const response = await (client as any).createTransaction({
    walletId: fromWalletId,
    tokenId,
    destinationAddress: toAddress,
    amounts: [amount],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    idempotencyKey: `tx-${fromWalletId}-${Date.now()}`,
  });

  return response?.data?.id || '';
}

/**
 * Cüzdan bakiyesini sorgular
 */
export async function getWalletBalance(walletId: string): Promise<{ token: string; amount: string }[]> {
  const client = getClient();
  const response = await (client as any).getWalletTokenBalance({ walletId });
  return (response?.data?.tokenBalances || []).map((b: any) => ({
    token: b.token?.symbol || 'UNKNOWN',
    amount: b.amount || '0',
  }));
}

/**
 * Smart contract fonksiyonu çağırır (developer-controlled cüzdandan)
 * Örn: BlessingPool.bless(), AgentRegistry.registerAgent()
 */
export async function callContract(
  walletId: string,
  contractAddress: string,
  abiFunctionSignature: string,
  abiParameters: string[]
): Promise<string> {
  const client = getClient();
  const response = await (client as any).createContractExecutionTransaction({
    walletId,
    contractAddress,
    abiFunctionSignature,
    abiParameters,
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
    idempotencyKey: `contract-${walletId}-${Date.now()}`,
  });
  return response?.data?.id || '';
}
