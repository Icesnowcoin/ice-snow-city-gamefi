import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import solc from "solc";
import { ethers } from "ethers";

const root = process.cwd();
const rpcUrl = process.env.SIMULATED_RPC_URL ?? "http://127.0.0.1:8545";
const sources = {
  "sim-contracts/MockISC.sol": fs.readFileSync(path.join(root, "sim-contracts/MockISC.sol"), "utf8"),
  "sim-contracts/MockLand.sol": fs.readFileSync(path.join(root, "sim-contracts/MockLand.sol"), "utf8"),
  "contracts/TaxSystem.sol": fs.readFileSync(path.join(root, "contracts/TaxSystem.sol"), "utf8"),
  "contracts/ISCSeaportStyleMarketplaceOffersDraft.sol": fs.readFileSync(path.join(root, "contracts/ISCSeaportStyleMarketplaceOffersDraft.sol"), "utf8"),
};

function findImport(importPath) {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "node_modules", importPath),
    path.join(root, "node_modules", ".pnpm", importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, "utf8") };
  }
  const nodeModules = path.join(root, "node_modules", "@openzeppelin", "contracts");
  if (importPath.startsWith("@openzeppelin/contracts/")) {
    const candidate = path.join(nodeModules, importPath.slice("@openzeppelin/contracts/".length));
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, "utf8") };
  }
  return { error: `Import not found: ${importPath}` };
}

function compile(sourceName, contractName) {
  const input = {
    language: "Solidity",
    sources: Object.fromEntries(Object.entries(sources).map(([file, content]) => [file, { content }])),
    settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
  const errors = (output.errors ?? []).filter((error) => error.severity === "error");
  if (errors.length) throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  const compiled = output.contracts?.[sourceName]?.[contractName];
  if (!compiled?.evm?.bytecode?.object) throw new Error(`Missing bytecode for ${sourceName}:${contractName}`);
  return compiled;
}

async function deploy(provider, signer, sourceName, contractName, args = []) {
  const compiled = compile(sourceName, contractName);
  const factory = new ethers.ContractFactory(compiled.abi, compiled.evm.bytecode.object, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return { contract, abi: compiled.abi };
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const [deployer, seller, buyer] = await Promise.all([0, 1, 2].map((index) => provider.getSigner(index)));
const network = await provider.getNetwork();
const deployerAddress = await deployer.getAddress();
const sellerAddress = await seller.getAddress();
const buyerAddress = await buyer.getAddress();
const treasury = ethers.Wallet.createRandom().address;
const marketing = ethers.Wallet.createRandom().address;

const { contract: isc } = await deploy(provider, deployer, "sim-contracts/MockISC.sol", "MockISC");
const { contract: land } = await deploy(provider, deployer, "sim-contracts/MockLand.sol", "MockLand");
const { contract: tax } = await deploy(provider, deployer, "contracts/TaxSystem.sol", "TaxSystem", [await isc.getAddress(), treasury, marketing, 2, 3]);
const { contract: market } = await deploy(provider, deployer, "contracts/ISCSeaportStyleMarketplaceOffersDraft.sol", "ISCSeaportStyleMarketplaceOffersDraft", [await isc.getAddress(), treasury]);

const price = ethers.parseEther("1000");
await (await isc.faucet(sellerAddress, price * 2n)).wait();
await (await isc.faucet(buyerAddress, price * 3n)).wait();
await (await isc.connect(seller).approve(await market.getAddress(), price * 2n)).wait();
await (await isc.connect(buyer).approve(await market.getAddress(), price * 3n)).wait();

const mintTx = await land.connect(seller).mint(sellerAddress);
const mintReceipt = await mintTx.wait();
const tokenId = 0n;
await (await land.connect(seller).approve(await market.getAddress(), tokenId)).wait();

const domain = { name: "Ice Snow City Seaport Style Marketplace", version: "2", chainId: Number(network.chainId), verifyingContract: await market.getAddress() };
const types = { Order: [
  { name: "offerer", type: "address" }, { name: "nftContract", type: "address" }, { name: "tokenId", type: "uint256" },
  { name: "amount", type: "uint256" }, { name: "price", type: "uint256" }, { name: "expiration", type: "uint256" },
  { name: "nonce", type: "uint256" }, { name: "itemType", type: "uint8" }, { name: "orderType", type: "uint8" }, { name: "salt", type: "bytes32" },
] };
const now = Math.floor(Date.now() / 1000);
const listing = { offerer: sellerAddress, nftContract: await land.getAddress(), tokenId, amount: 1, price, expiration: now + 86400, nonce: 1, itemType: 0, orderType: 0, salt: ethers.id("local-sell-order") };
const listingSignature = await seller.signTypedData(domain, types, listing);
const sellReceipt = await (await market.connect(buyer).executeSellOrder(listing, listingSignature)).wait();
if ((await land.ownerOf(tokenId)) !== buyerAddress) throw new Error("SELL transfer failed");

const offerTokenId = 1n;
await (await land.connect(seller).mint(sellerAddress)).wait();
await (await land.connect(seller).approve(await market.getAddress(), offerTokenId)).wait();
const offer = { ...listing, offerer: buyerAddress, tokenId: offerTokenId, nonce: 2, orderType: 1, salt: ethers.id("local-buy-offer") };
const offerSignature = await buyer.signTypedData(domain, types, offer);
const offerReceipt = await (await market.connect(seller).acceptBuyOffer(offer, offerSignature)).wait();
if ((await land.ownerOf(offerTokenId)) !== buyerAddress) throw new Error("BUY_OFFER transfer failed");

await (await market.connect(seller).cancelNonce(3)).wait();
if (!(await market.cancelledNonces(sellerAddress, 3))) throw new Error("nonce cancellation failed");
const preview = await tax.previewTaxes(10_000, 20_000, 5, 5);
const expectedTreasury = (preview[0] * 6000n) / 10000n;
if (preview[1] !== expectedTreasury || preview[2] !== preview[0] - expectedTreasury) throw new Error("TaxSystem 60/40 failed");

console.log(JSON.stringify({
  mode: "local-simulated-mainnet",
  rpcUrl,
  chainId: Number(network.chainId),
  deployer: deployerAddress,
  treasury,
  marketing,
  contracts: { mockISC: await isc.getAddress(), mockLand: await land.getAddress(), taxSystem: await tax.getAddress(), marketplaceDraft: await market.getAddress() },
  deploymentTxs: { mockISC: isc.deploymentTransaction()?.hash, mockLand: land.deploymentTransaction()?.hash, taxSystem: tax.deploymentTransaction()?.hash, marketplaceDraft: market.deploymentTransaction()?.hash },
  interactionTxs: { mint: mintReceipt.hash, sellOrder: sellReceipt.hash, buyOffer: offerReceipt.hash },
  verification: { sellOrder: "passed", buyOffer: "passed", cancelNonce: "passed", taxSplit60_40: "passed", marketCommissionBps: (await market.COMMISSION_BPS()).toString(), writeScope: "local-hardhat-only" },
  auditBoundary: "Local simulation is not a third-party audit, bytecode verification, testnet deployment, or mainnet approval.",
}, null, 2));
