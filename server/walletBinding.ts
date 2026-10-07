import { getAddress, verifyMessage } from "ethers";

export interface WalletBindingChallenge {
  domain: string;
  address: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}

export function buildWalletBindingMessage(challenge: WalletBindingChallenge): string {
  if (challenge.chainId <= 0 || !challenge.nonce || new Date(challenge.expirationTime).getTime() <= Date.now()) throw new Error("钱包绑定挑战已过期或参数无效");
  const address = getAddress(challenge.address);
  return `${challenge.domain} wants you to sign in with your Ethereum account:\n${address}\n\n绑定 Ice Snow City 钱包，仅用于验证你对该地址的控制权。不会授权资产转移。\n\nChain ID: ${challenge.chainId}\nNonce: ${challenge.nonce}\nIssued At: ${challenge.issuedAt}\nExpiration Time: ${challenge.expirationTime}`;
}

export function recoverWalletFromBindingSignature(challenge: WalletBindingChallenge, signature: string): string {
  const message = buildWalletBindingMessage(challenge);
  const recovered = getAddress(verifyMessage(message, signature));
  if (recovered.toLowerCase() !== getAddress(challenge.address).toLowerCase()) throw new Error("钱包签名地址与挑战地址不一致");
  return recovered;
}
