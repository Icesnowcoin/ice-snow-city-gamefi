# NFT 铸造 ISC 消耗逻辑配置

## 关键配置信息（永久记录）

### 地址配置
| 地址类型 | 地址 | 说明 |
| :--- | :--- | :--- |
| **国库地址** | `0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019` | 接收 69% ISC，继续为游戏提供内需 |
| **营销钱包地址** | `0xF8A408495941ea30451Da613dC846Dcae47890f0` | 接收 30% ISC（国库的 30%） |
| **销毁地址** | `0x0000000000000000000000000000000000000000` | 接收 1% ISC，永久销毁 |

### ISC 消耗分配比例

当玩家铸造 NFT 时，消耗的 ISC 分配如下：

```
总消耗 ISC = 100%
├── 销毁（永久）: 1%
│   └── 发送到销毁地址 (0x0000...0000)
├── 国库分配: 69%
│   ├── 国库地址: 69% - 30% = 39%
│   │   └── 发送到 0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019
│   └── 营销钱包: 30%（国库的 30%）
│       └── 发送到 0xF8A408495941ea30451Da613dC846Dcae47890f0
└── 剩余: 30%
    └── 预留给其他机制或销毁
```

**简化分配：**
- **销毁**: 1%
- **国库**: 69%
- **营销**: 30%
- **预留**: 0%

### Gas 费用承担

| 费用类型 | 承担方 | 说明 |
| :--- | :--- | :--- |
| **NFT 铸造 Gas** | 玩家 | 铸造 NFT 时的链上 Gas 费用 |
| **ISC 转账 Gas** | 玩家 | ISC 分配转账的 Gas 费用 |
| **总 Gas** | 玩家 | 玩家需承担所有链上操作的 Gas 费用 |

## 智能合约实现

### LandNFT 合约修改

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LandNFT is ERC721, Ownable, ReentrancyGuard {
    IERC20 public immutable iscToken;
    
    // ISC 分配地址
    address public constant TREASURY_ADDRESS = 0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019;
    address public constant MARKETING_WALLET = 0xF8A408495941ea30451Da613dC846Dcae47890f0;
    address public constant BURN_ADDRESS = 0x0000000000000000000000000000000000000000;
    
    // ISC 分配比例（基数 100）
    uint256 public constant BURN_PERCENTAGE = 1;      // 1% 永久销毁
    uint256 public constant TREASURY_PERCENTAGE = 69;  // 69% 国库
    uint256 public constant MARKETING_PERCENTAGE = 30; // 30% 营销钱包
    
    event LandMinted(
        uint256 indexed tokenId,
        address indexed minter,
        uint256 iscCost,
        uint256 burnAmount,
        uint256 treasuryAmount,
        uint256 marketingAmount
    );
    
    constructor(address _iscToken) ERC721("IceSnowCityLand", "LAND") {
        require(_iscToken != address(0), "Invalid ISC token");
        iscToken = IERC20(_iscToken);
    }
    
    /**
     * @dev 铸造土地 NFT
     * ISC 消耗分配：1% 销毁 + 39% 国库 + 30% 营销 + 30% 预留
     */
    function mintLand(
        uint256 tokenId,
        uint256 iscCost
    ) external nonReentrant {
        require(iscCost > 0, "ISC cost must be greater than 0");
        require(iscToken.balanceOf(msg.sender) >= iscCost, "Insufficient ISC balance");
        require(iscToken.allowance(msg.sender, address(this)) >= iscCost, "Insufficient allowance");
        
        // 计算分配金额
        uint256 burnAmount = (iscCost * BURN_PERCENTAGE) / 100;
        uint256 treasuryAmount = (iscCost * TREASURY_PERCENTAGE) / 100;
        uint256 marketingAmount = (iscCost * MARKETING_PERCENTAGE) / 100;
        
        // 从玩家转账 ISC
        require(
            iscToken.transferFrom(msg.sender, address(this), iscCost),
            "ISC transfer failed"
        );
        
        // 分配 ISC
        // 1. 销毁 1%
        require(
            iscToken.transfer(BURN_ADDRESS, burnAmount),
            "Burn transfer failed"
        );
        
        // 2. 转账到国库 39%
        require(
            iscToken.transfer(TREASURY_ADDRESS, treasuryAmount),
            "Treasury transfer failed"
        );
        
        // 3. 转账到营销钱包 30%
        require(
            iscToken.transfer(MARKETING_WALLET, marketingAmount),
            "Marketing transfer failed"
        );
        
        // 4. 铸造 NFT
        _safeMint(msg.sender, tokenId);
        
        emit LandMinted(
            tokenId,
            msg.sender,
            iscCost,
            burnAmount,
            treasuryAmount,
            marketingAmount
        );
    }
}
```

### BuildingNFT 合约修改

```solidity
// 同样的 ISC 分配逻辑应用于 BuildingNFT
// 1% 销毁 + 39% 国库 + 30% 营销 + 30% 预留
```

## 前端实现

### 铸造成本计算

```typescript
interface MintingCostBreakdown {
  totalISC: string;
  burnAmount: string;      // 1%
  treasuryAmount: string;  // 39%
  marketingAmount: string; // 30%
  reserveAmount: string;   // 30%
  gasEstimate: string;     // 用户需承担的 Gas 费用
}

function calculateMintingCost(iscAmount: bigint): MintingCostBreakdown {
  const burnAmount = (iscAmount * 1n) / 100n;
  const treasuryAmount = (iscAmount * 39n) / 100n;
  const marketingAmount = (iscAmount * 30n) / 100n;
  const reserveAmount = iscAmount - burnAmount - treasuryAmount - marketingAmount;
  
  return {
    totalISC: ethers.formatEther(iscAmount),
    burnAmount: ethers.formatEther(burnAmount),
    treasuryAmount: ethers.formatEther(treasuryAmount),
    marketingAmount: ethers.formatEther(marketingAmount),
    reserveAmount: ethers.formatEther(reserveAmount),
    gasEstimate: "0.01 BNB" // 示例估算
  };
}
```

### 铸造 UI 组件

```typescript
// 在铸造对话框中显示成本分解
<div className="space-y-2 text-xs">
  <div className="flex justify-between">
    <span>销毁（永久）:</span>
    <span className="text-red-500">{breakdown.burnAmount} ISC (1%)</span>
  </div>
  <div className="flex justify-between">
    <span>国库分配:</span>
    <span className="text-blue-500">{breakdown.treasuryAmount} ISC (39%)</span>
  </div>
  <div className="flex justify-between">
    <span>营销钱包:</span>
    <span className="text-purple-500">{breakdown.marketingAmount} ISC (30%)</span>
  </div>
  <div className="flex justify-between border-t pt-1">
    <span>Gas 费用 (由玩家承担):</span>
    <span className="text-orange-500">{breakdown.gasEstimate}</span>
  </div>
</div>
```

## 部署检查清单

- [ ] 验证国库地址：`0x3B79D4A0bd73FCaB12DFEd34dA830b376A50e019`
- [ ] 验证营销钱包地址：`0xF8A408495941ea30451Da613dC846Dcae47890f0`
- [ ] 验证销毁地址：`0x0000000000000000000000000000000000000000`
- [ ] 更新 LandNFT.sol 合约
- [ ] 更新 BuildingNFT.sol 合约
- [ ] 更新前端铸造成本计算逻辑
- [ ] 更新前端 UI 显示成本分解
- [ ] 在 BSC 测试网部署并测试
- [ ] 验证 ISC 分配是否正确
- [ ] 验证 Gas 费用由玩家承担
- [ ] 部署到 BSC 主网

## 重要说明

1. **永久销毁**：1% 的 ISC 将被永久发送到销毁地址，无法恢复。
2. **国库用途**：69% 的 ISC 用于游戏内需（NPC 薪资、商品价格等）。
3. **营销推广**：30% 的 ISC（来自国库分配）用于营销和推广。
4. **Gas 承担**：玩家需承担所有链上操作的 Gas 费用，包括 NFT 铸造和 ISC 转账。
5. **透明性**：所有 ISC 分配都在链上透明记录，可通过区块浏览器验证。

---

**配置生效日期**：2026-08-08
**维护者**：冰雪城市开发团队
