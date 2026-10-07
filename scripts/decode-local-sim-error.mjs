import { id } from "ethers";
const names = [
  "InvalidAddress()", "InvalidOrder()", "InvalidItemType()", "InvalidOrderType()", "OrderExpired()",
  "OrderIsCancelled()", "OrderAlreadySettled()", "InvalidSignature()", "SelfPurchase()", "PaymentFailed()",
  "AssetTransferFailed()", "OfferNotAcceptedByOwner()", "ERC20InsufficientAllowance(address,uint256,uint256)",
  "ERC20InsufficientBalance(address,uint256,uint256)", "ERC721InsufficientApproval(uint256)",
];
for (const name of names) console.log(`${id(name).slice(0, 10)} ${name}`);
