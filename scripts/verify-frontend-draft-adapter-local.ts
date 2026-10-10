import fs from "node:fs";
import { ethers } from "ethers";
import { createDraftMarketplaceClient, SIMULATED_CHAIN_ID } from "../client/src/lib/iscMarketplaceDraft";

type SimulationResult = {
  contracts: { mockISC: string; mockLand: string; marketplaceDraft: string };
};

const result = JSON.parse(fs.readFileSync("/tmp/ice-snow-local-sim-final.json", "utf8")) as SimulationResult;
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const network = await provider.getNetwork();
if (Number(network.chainId) !== SIMULATED_CHAIN_ID) throw new Error("unexpected simulation chain");

const seller = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
const buyer = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);
const client = createDraftMarketplaceClient({
  signer: seller,
  marketplaceAddress: result.contracts.marketplaceDraft,
  iscTokenAddress: result.contracts.mockISC,
  chainId: Number(network.chainId),
  simulatedOnly: true,
});

const order = {
  offerer: seller.address,
  nftContract: result.contracts.mockLand,
  tokenId: 2n,
  amount: 1n,
  price: ethers.parseEther("1000"),
  expiration: BigInt(Math.floor(Date.now() / 1000) + 86400),
  nonce: 9n,
  itemType: 0,
  orderType: 0,
  salt: ethers.id("frontend-adapter-order"),
};
const signed = await client.sign(order);
const recovered = ethers.verifyTypedData(
  { name: "Ice Snow City Seaport Style Marketplace", version: "2", chainId: SIMULATED_CHAIN_ID, verifyingContract: result.contracts.marketplaceDraft },
  { Order: [
    { name: "offerer", type: "address" }, { name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" },
    { name: "amount", type: "uint256" }, { name: "price", type: "uint256" }, { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" }, { name: "itemType", type: "uint8" }, { name: "orderType", type: "uint8" }, { name: "salt", type: "bytes32" },
  ] },
  signed.order,
  signed.signature,
);
if (recovered !== seller.address) throw new Error("frontend EIP-712 signature mismatch");
const sellerBalance = await client.balanceOf(seller.address);
const cancelled = await client.isNonceCancelled(seller.address, 3n);
if (sellerBalance <= 0n || !cancelled) throw new Error("frontend read interaction failed");

console.log(JSON.stringify({
  mode: "frontend-adapter-local-verification",
  chainId: Number(network.chainId),
  signature: "passed",
  balanceRead: "passed",
  cancelledNonceRead: "passed",
  buyerAddress: buyer.address,
  guard: "simulation-only",
}, null, 2));
