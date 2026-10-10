# Ice Snow City NFT 订单 EIP-712 前端集成示例

以下示例对应 `ISCSeaportStyleMarketplaceDraft.sol` 的 `Order` 结构和 EIP-712 域。卖家只签署订单，不发送链上交易；买家在确认价格、10%市场佣金、授权额度和 Gas 后，才调用 `executeOrder(order, signature)`。

## 1. 合约对应的 EIP-712 定义

```ts
export const domain = {
  name: "Ice Snow City Seaport Style Marketplace",
  version: "1",
  chainId: 56, // 示例：BSC 主网；测试网必须替换为 97
  verifyingContract: MARKETPLACE_ADDRESS,
} as const;

export const types = {
  Order: [
    { name: "offerer", type: "address" },
    { name: "nftContract", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "itemType", type: "uint8" },
    { name: "salt", type: "bytes32" },
  ],
};
```

`domain.name`、`domain.version`、字段顺序和字段类型必须与 Solidity 合约完全一致。`chainId` 和 `verifyingContract` 也必须对应实际执行订单的网络和市场合约地址；跨链或换合约地址后，旧签名不能复用。

## 2. ethers.js v6：卖家构造并签署订单

项目已新增 `client/src/lib/seaportOrderSigning.ts`，可直接使用以下接口：

```ts
import { BrowserProvider } from "ethers";
import {
  buildSeaportStyleOrder,
  signSeaportStyleOrder,
  recoverSeaportStyleOrderSigner,
} from "@/lib/seaportOrderSigning";

const provider = new BrowserProvider(window.ethereum);
const network = await provider.getNetwork();
const marketplaceAddress = "0xYourDeployedMarketplace";
const seller = await provider.getSigner();
const sellerAddress = await seller.getAddress();

const order = buildSeaportStyleOrder({
  offerer: sellerAddress,
  nftContract: "0xYourLandOrBuildingNFT",
  tokenId: BigInt(42),
  amount: BigInt(1), // ERC-721 必须是 1；ERC-1155 必须大于 0
  price: BigInt("1000000000000000000000"), // 1000 ISC wei，假设 18 decimals
  expiration: BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60),
  nonce: BigInt(7),
  itemType: 0, // 0 = ERC-721；1 = ERC-1155
  salt: "0x0000000000000000000000000000000000000000000000000000000000000042",
});

const signed = await signSeaportStyleOrder(
  provider,
  order,
  network.chainId,
  marketplaceAddress,
);

// 可以把 signed.order 和 signed.signature 发布到后端订单索引器或订单簿。
// 签名本身不发送交易，也不会发生 ISC 或 NFT 转移。
console.log(signed);

const recovered = recoverSeaportStyleOrderSigner(
  signed.order,
  signed.signature,
  network.chainId,
  marketplaceAddress,
);
if (recovered.toLowerCase() !== sellerAddress.toLowerCase()) {
  throw new Error("本地签名恢复地址与卖家地址不一致");
}
```

在真正创建订单前，卖家还必须对 NFT 合约执行 `setApprovalForAll(marketplaceAddress, true)`，或按照 NFT 合约支持的方式批准市场合约。批准交易与后续成交交易均由用户钱包发起并承担 Gas。

## 3. viem：等价签名写法

如果项目选择 viem，可使用 `WalletClient`。当前项目未安装 viem，因此以下代码作为可选集成示例；安装依赖后再接入工程：

```ts
import { parseAbi, type Address, type WalletClient } from "viem";

const domain = {
  name: "Ice Snow City Seaport Style Marketplace",
  version: "1",
  chainId: 56,
  verifyingContract: "0xYourDeployedMarketplace" as Address,
} as const;

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
    { name: "salt", type: "bytes32" },
  ],
} as const;

const order = {
  offerer: account,
  nftContract: "0xYourLandOrBuildingNFT" as Address,
  tokenId: 42n,
  amount: 1n,
  price: 1_000n * 10n ** 18n,
  expiration: BigInt(Math.floor(Date.now() / 1000) + 86_400),
  nonce: 7n,
  itemType: 0,
  salt: "0x0000000000000000000000000000000000000000000000000000000000000042",
} as const;

const signature = await walletClient.signTypedData({
  account,
  domain,
  types,
  primaryType: "Order",
  message: order,
});
```

## 4. 买家执行订单前的授权和成交

卖家签名不是成交。买家需要先确认订单仍未过期、订单 nonce 未被卖家撤销、订单哈希未完成，并检查 NFT 所有权/余额和 ISC 余额。随后买家对 ISC 合约执行 `approve(marketplaceAddress, order.price)`，再调用：

```ts
const prepared = buildExecuteOrderCall(
  provider,
  marketplaceAddress,
  signed.order,
  signed.signature,
);

// UI 在展示价格、佣金和 Gas 后，由用户明确点击确认：
const tx = await prepared.contract.executeOrder(
  ...prepared.args,
);
await tx.wait();
```

本示例中的 `buildExecuteOrderCall` 只准备合约调用，不会隐式广播交易。实际 UI 必须显示：总价、卖家所得 90%、国库佣金 10%、ISC 授权额度、NFT 类型、Token ID、订单过期时间和预估 Gas。

## 5. 安全注意事项

不要在前端硬编码私钥，不要由服务端代替用户签署订单，不要接受没有 `chainId` 和 `verifyingContract` 校验的签名，也不要把签名订单当作已经成交。订单索引器应以链上 `OrderFulfilled`、`OrderCancelled` 和 `OrderNonceCancelled` 事件为最终状态来源。

该市场 10%佣金只属于市场成交规则。它不改变 ISC 代币本身的普通 ERC-20 属性，也不覆盖 NFT 铸造的 1%销毁/69%国库/30%营销规则或社交消费的 60%/40%规则。
