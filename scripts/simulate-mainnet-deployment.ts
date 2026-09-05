import { ethers } from "hardhat";

const ZERO_BYTES32 = ethers.ZeroHash;
const ONE_DAY = 24 * 60 * 60;

async function main() {
  const [deployer, seller, buyer] = await ethers.getSigners();
  const treasury = ethers.Wallet.createRandom().address;
  const marketing = ethers.Wallet.createRandom().address;

  const isc = await (await ethers.getContractFactory("MockISC")).deploy();
  await isc.waitForDeployment();
  const land = await (await ethers.getContractFactory("MockLand")).deploy();
  await land.waitForDeployment();

  const tax = await (
    await ethers.getContractFactory("TaxSystem")
  ).deploy(await isc.getAddress(), treasury, marketing, 2, 3);
  await tax.waitForDeployment();

  const market = await (
    await ethers.getContractFactory("ISCSeaportStyleMarketplaceOffersDraft")
  ).deploy(await isc.getAddress(), treasury);
  await market.waitForDeployment();

  const price = ethers.parseEther("1000");
  await isc.faucet(seller.address, price);
  await isc.faucet(buyer.address, price * 2n);
  await isc.connect(seller).approve(await market.getAddress(), price * 2n);
  await isc.connect(buyer).approve(await market.getAddress(), price * 2n);

  const tokenId = await land.connect(seller).mint.staticCall(seller.address);
  await land.connect(seller).mint(seller.address);
  await land.connect(seller).approve(await market.getAddress(), tokenId);

  const domain = {
    name: "Ice Snow City Seaport Style Marketplace",
    version: "2",
    chainId: 31337,
    verifyingContract: await market.getAddress(),
  };
  const types = {
    Order: [
      { name: "offerer", type: "address" },
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "expiration", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "itemType", type: "uint8" },
      { name: "orderType", type: "uint8" },
      { name: "salt", type: "bytes32" },
    ],
  };
  const listing = {
    offerer: seller.address,
    nftContract: await land.getAddress(),
    tokenId,
    amount: 1,
    price,
    expiration: Math.floor(Date.now() / 1000) + ONE_DAY,
    nonce: 1,
    itemType: 0,
    orderType: 0,
    salt: ethers.id("local-sell-order"),
  };
  const listingSignature = await seller.signTypedData(domain, types, listing);
  await market.connect(buyer).executeSellOrder(listing, listingSignature);
  if ((await land.ownerOf(tokenId)) !== buyer.address) throw new Error("SELL transfer failed");

  const offerTokenId = await land.connect(buyer).mint.staticCall(buyer.address);
  await land.connect(buyer).mint(buyer.address);
  const offer = {
    ...listing,
    offerer: buyer.address,
    tokenId: offerTokenId,
    nonce: 2,
    orderType: 1,
    salt: ethers.id("local-buy-offer"),
  };
  const offerSignature = await buyer.signTypedData(domain, types, offer);
  await land.connect(buyer).approve(await market.getAddress(), offerTokenId);
  await market.connect(seller).acceptBuyOffer(offer, offerSignature);
  if ((await land.ownerOf(offerTokenId)) !== seller.address) throw new Error("BUY_OFFER transfer failed");

  const cancelOrder = { ...listing, nonce: 3, salt: ethers.id("local-cancel") };
  await market.connect(seller).cancelNonce(cancelOrder.nonce);
  const cancelled = await market.cancelledNonces(seller.address, cancelOrder.nonce);
  if (!cancelled) throw new Error("nonce cancellation failed");

  const preview = await tax.previewTaxes(10_000, 20_000, 5, 5);
  const expectedTreasury = (preview[0] * 6000n) / 10000n;
  if (preview[1] !== expectedTreasury || preview[2] !== preview[0] - expectedTreasury) {
    throw new Error("TaxSystem 60/40 split failed");
  }

  console.log(JSON.stringify({
    mode: "local-simulated-mainnet",
    chainId: 31337,
    deployer: deployer.address,
    treasury,
    marketing,
    contracts: {
      mockISC: await isc.getAddress(),
      mockLand: await land.getAddress(),
      taxSystem: await tax.getAddress(),
      marketplaceDraft: await market.getAddress(),
    },
    verification: {
      sellOrder: "passed",
      buyOffer: "passed",
      cancelNonce: "passed",
      taxSplit60_40: "passed",
      marketCommissionBps: (await market.COMMISSION_BPS()).toString(),
      writeScope: "local-hardhat-only",
    },
    auditBoundary: "Local simulation is not a third-party audit, bytecode verification, testnet deployment, or mainnet approval.",
    zeroHash: ZERO_BYTES32,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
