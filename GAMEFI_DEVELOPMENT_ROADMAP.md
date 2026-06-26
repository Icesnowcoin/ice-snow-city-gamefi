# 冰雪城市 GameFi 项目 - 完整开发路线图

## 项目概述

**项目名称：** 冰雪城市 (Ice Snow City)  
**类型：** 模拟人生 + 模拟经营 + GameFi  
**目标链：** BSC (Binance Smart Chain)  
**代币：** ISC (Ice Snow Coin) - ERC20 治理代币  
**核心玩法：** 链下模拟经营 + 链上资产所有权

## 核心设计原则

### 1. 链上链下平衡策略

| 操作类型 | 执行位置 | 延迟 | 成本 | 说明 |
|--------|--------|------|------|------|
| **日常交互** | 链下 (Colyseus) | <100ms | 免费 | 移动、工作、社交、对话 |
| **资产交易** | 链上 (BSC) | 3-5s | 0.001-0.01 BNB | 购买房产、交易物品 |
| **状态锚定** | 链上 (BSC) | 每日/周 | 批量 | 角色属性、资产所有权 |
| **排行榜** | 链下 (数据库) | <1s | 免费 | 实时排名计算 |

### 2. 经济模型设计

**双代币体系：**

| 代币 | 名称 | 供应量 | 用途 | 获取方式 |
|------|------|--------|------|--------|
| **ISC** | Ice Snow Coin | 202.6M | 治理、质押、分红 | 购买、质押挖矿 |
| **GC** | Game Coin | 无限 | 游戏内消费 | 工作、任务、交易 |

**经济流向：**
```
玩家工作 → 获得 GC → 消费 GC(购物/税费) → 消耗 50% 销毁 → 
ISC 质押 → 获得 GC 利息 → 再投资
```

### 3. 防死亡螺旋机制

**消耗 > 产出：**
- 玩家日常产出：100 GC/天
- 玩家日常消耗：120 GC/天（税费、消费）
- 结果：强制储蓄，驱动 ISC 质押

**稀缺性驱动：**
- 土地总数：10,000 块（限量发行）
- 房产总数：50,000 套（限量发行）
- 核心 NPC：200 个（限量发行）
- 结果：资产升值预期

---

## Phase 1: MVP 核心循环 (2-3 个月)

### 目标
建立可玩的"人生模拟"核心循环，集成基础 GameFi 功能。

### 1.1 游戏玩法层

**改造 FarmSim2800 的核心循环：**

```
工作系统
├── 职业选择（商人、农民、工人、医生等）
├── 每日工作（产出 GC 和经验）
├── 工作升级（提升时薪）
└── 职业转换（冷却时间 7 天）

消费系统
├── 食物（恢复饥饿度，消耗 GC）
├── 住房（提升幸福度，消耗 GC）
├── 娱乐（恢复疲劳，消耗 GC）
└── 税费（每月自动扣除 10% 收入）

升级系统
├── 经验值（工作、任务、社交获得）
├── 等级（每 1000 经验升 1 级）
├── 属性点（每级获得 5 点，可分配）
└── 技能树（解锁新职业、新房产）
```

**实现方案：**

```typescript
// server/game-logic/systems/WorkSystem.ts
export class WorkSystem {
  // 职业定义
  professions = {
    merchant: { baseSalary: 100, xpPerDay: 50 },
    farmer: { baseSalary: 80, xpPerDay: 60 },
    worker: { baseSalary: 60, xpPerDay: 40 },
    doctor: { baseSalary: 150, xpPerDay: 80 },
  };

  // 每日工作
  doWork(player: Player, profession: string): GameAction {
    const prof = this.professions[profession];
    const salary = prof.baseSalary * (1 + player.professionLevel / 10);
    
    return {
      type: 'WORK_COMPLETE',
      payload: {
        playerId: player.id,
        gcEarned: salary,
        xpEarned: prof.xpPerDay,
        profession,
      }
    };
  }

  // 职业升级
  upgradeProfession(player: Player, profession: string): GameAction {
    return {
      type: 'PROFESSION_UPGRADE',
      payload: {
        playerId: player.id,
        profession,
        newLevel: player.professionLevel + 1,
      }
    };
  }
}
```

### 1.2 区块链集成层

**使用 Open-GameFi 框架：**

```solidity
// contracts/GameAsset.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 创世角色 NFT
contract CharacterNFT is ERC721 {
    struct Character {
        uint256 level;
        uint256 experience;
        string profession;
        uint256 createdAt;
    }
    
    mapping(uint256 => Character) public characters;
    
    function mintCharacter(
        address to,
        string memory profession
    ) external returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        _mint(to, tokenId);
        
        characters[tokenId] = Character({
            level: 1,
            experience: 0,
            profession: profession,
            createdAt: block.timestamp
        });
        
        return tokenId;
    }
    
    // 角色属性更新（由游戏合约调用）
    function updateCharacter(
        uint256 tokenId,
        uint256 newLevel,
        uint256 newExperience
    ) external onlyGameContract {
        characters[tokenId].level = newLevel;
        characters[tokenId].experience = newExperience;
    }
}

// 游戏币合约
contract GameCoin is ERC20 {
    address public gameContract;
    
    constructor() ERC20("Game Coin", "GC") {
        gameContract = msg.sender;
    }
    
    // 游戏合约铸造游戏币
    function mint(address to, uint256 amount) external onlyGameContract {
        _mint(to, amount);
    }
    
    // 销毁游戏币（消耗机制）
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
```

### 1.3 后端实现

**tRPC 路由集成：**

```typescript
// server/routers/gamePhase1.ts
export const gamePhase1Router = router({
  // 玩家每日工作
  doWork: protectedProcedure
    .input(z.object({ profession: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workResult = workSystem.doWork(ctx.user, input.profession);
      const newState = gameReducer(currentState, workResult);
      
      // 铸造游戏币
      await gameCoinContract.mint(
        ctx.user.address,
        workResult.payload.gcEarned
      );
      
      // 保存到数据库
      await savePlayerState(ctx.user.id, newState);
      
      return {
        gcEarned: workResult.payload.gcEarned,
        xpEarned: workResult.payload.xpEarned,
        newLevel: newState.player.level,
      };
    }),

  // 获取玩家状态
  getPlayerState: protectedProcedure
    .query(async ({ ctx }) => {
      const state = await loadPlayerState(ctx.user.id);
      return state;
    }),

  // 购买物品
  buyItem: protectedProcedure
    .input(z.object({ itemId: z.string(), price: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 检查余额
      const balance = await gameCoinContract.balanceOf(ctx.user.address);
      if (balance < input.price) {
        throw new Error('Insufficient balance');
      }
      
      // 销毁游戏币（消耗）
      await gameCoinContract.burn(input.price);
      
      // 更新游戏状态
      const action = {
        type: 'ITEM_PURCHASED',
        payload: { playerId: ctx.user.id, itemId: input.itemId }
      };
      
      const newState = gameReducer(currentState, action);
      await savePlayerState(ctx.user.id, newState);
      
      return { success: true, newBalance: balance - input.price };
    }),
});
```

### 1.4 前端实现

**React 组件：**

```typescript
// client/src/pages/GamePhase1.tsx
export function GamePhase1() {
  const { data: playerState, isLoading } = trpc.game.phase1.getPlayerState.useQuery();
  const workMutation = trpc.game.phase1.doWork.useMutation();
  const buyMutation = trpc.game.phase1.buyItem.useMutation();

  const handleWork = async (profession: string) => {
    const result = await workMutation.mutateAsync({ profession });
    toast.success(`工作完成！获得 ${result.gcEarned} GC`);
  };

  const handleBuyItem = async (itemId: string, price: number) => {
    const result = await buyMutation.mutateAsync({ itemId, price });
    toast.success(`购买成功！剩余 ${result.newBalance} GC`);
  };

  return (
    <div className="game-container">
      <div className="player-stats">
        <div>等级: {playerState?.player.level}</div>
        <div>经验: {playerState?.player.experience}</div>
        <div>游戏币: {playerState?.wallet.gc}</div>
        <div>ISC: {playerState?.wallet.isc}</div>
      </div>

      <div className="work-section">
        <h3>工作</h3>
        {['merchant', 'farmer', 'worker', 'doctor'].map(prof => (
          <button key={prof} onClick={() => handleWork(prof)}>
            选择 {prof}
          </button>
        ))}
      </div>

      <div className="shop-section">
        <h3>商店</h3>
        {items.map(item => (
          <button key={item.id} onClick={() => handleBuyItem(item.id, item.price)}>
            购买 {item.name} - {item.price} GC
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 1.5 MVP 检查清单

- [ ] 工作系统完整实现（4 个职业）
- [ ] 消费系统完整实现（食物、住房、娱乐）
- [ ] 升级系统完整实现（经验、等级、属性）
- [ ] GameCoin 合约部署到 BSC 测试网
- [ ] CharacterNFT 合约部署到 BSC 测试网
- [ ] tRPC 路由完整实现
- [ ] 前端页面完整实现
- [ ] 端到端测试通过
- [ ] 用户验收测试（10+ 测试用户）

---

## Phase 2: GameFi 深化 (2-3 个月)

### 目标
引入 NFT 资产、交易市场、质押挖矿等 GameFi 机制。

### 2.1 NFT 资产系统

**土地和房产 NFT：**

```solidity
// contracts/PropertyNFT.sol
contract PropertyNFT is ERC721 {
    struct Property {
        string propertyType; // 'land', 'house', 'shop', 'farm'
        uint256 location; // 网格坐标
        uint256 rentalIncome; // 月租金
        address currentRenter;
        uint256 rentStartTime;
    }
    
    mapping(uint256 => Property) public properties;
    
    // 铸造土地（限量 10,000）
    function mintLand(
        address to,
        uint256 location,
        uint256 rentalIncome
    ) external onlyOwner {
        require(totalSupply() < 10000, "Land limit reached");
        uint256 tokenId = totalSupply() + 1;
        _mint(to, tokenId);
        
        properties[tokenId] = Property({
            propertyType: 'land',
            location: location,
            rentalIncome: rentalIncome,
            currentRenter: address(0),
            rentStartTime: 0
        });
    }
    
    // 出租房产
    function rentProperty(
        uint256 tokenId,
        address renter,
        uint256 duration
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        properties[tokenId].currentRenter = renter;
        properties[tokenId].rentStartTime = block.timestamp;
    }
    
    // 收取租金
    function collectRent(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Property storage prop = properties[tokenId];
        require(prop.currentRenter != address(0), "No renter");
        
        // 计算应付租金
        uint256 monthsRented = (block.timestamp - prop.rentStartTime) / 30 days;
        uint256 rentDue = prop.rentalIncome * monthsRented;
        
        // 转账租金
        gameCoinContract.transferFrom(prop.currentRenter, msg.sender, rentDue);
    }
}
```

### 2.2 交易市场

```solidity
// contracts/GameMarket.sol
contract GameMarket {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }
    
    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;
    
    // 上架物品
    function listItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external {
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        listings[listingCount] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        listingCount++;
    }
    
    // 购买物品
    function buyItem(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        
        // 转账游戏币
        gameCoinContract.transferFrom(msg.sender, listing.seller, listing.price);
        
        // 转账 NFT
        IERC721(listing.nftContract).transferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );
        
        listing.active = false;
    }
}
```

### 2.3 质押挖矿

```solidity
// contracts/StakingPool.sol
contract StakingPool {
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 rewardDebt;
    }
    
    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public rewardRate = 5; // 5% APY
    
    // 质押 ISC
    function stake(uint256 amount) external {
        iscToken.transferFrom(msg.sender, address(this), amount);
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        totalStaked += amount;
    }
    
    // 计算奖励
    function calculateReward(address staker) public view returns (uint256) {
        Stake storage stake = stakes[staker];
        uint256 stakingDuration = block.timestamp - stake.startTime;
        uint256 yearInSeconds = 365 days;
        
        return (stake.amount * rewardRate * stakingDuration) / (100 * yearInSeconds);
    }
    
    // 领取奖励
    function claimReward() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards");
        
        gameCoinContract.mint(msg.sender, reward);
        stakes[msg.sender].rewardDebt += reward;
    }
    
    // 解除质押
    function unstake(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        
        // 先领取奖励
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            gameCoinContract.mint(msg.sender, reward);
        }
        
        // 返还本金
        iscToken.transfer(msg.sender, amount);
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
    }
}
```

### 2.4 社交系统

**链上关系绑定：**

```typescript
// server/routers/socialSystem.ts
export const socialRouter = router({
  // 结婚
  marry: protectedProcedure
    .input(z.object({ partnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 检查双方是否已婚
      const player1 = await getPlayer(ctx.user.id);
      const player2 = await getPlayer(input.partnerId);
      
      if (player1.maritalStatus !== 'single' || player2.maritalStatus !== 'single') {
        throw new Error('One or both players are already married');
      }
      
      // 创建结婚 NFT（证书）
      const marriageCertificate = await characterNFT.mintMarriageCertificate(
        ctx.user.id,
        input.partnerId
      );
      
      // 更新玩家状态
      await updatePlayer(ctx.user.id, { maritalStatus: 'married', partnerId: input.partnerId });
      await updatePlayer(input.partnerId, { maritalStatus: 'married', partnerId: ctx.user.id });
      
      return { certificateId: marriageCertificate };
    }),

  // 合伙经营
  startPartnership: protectedProcedure
    .input(z.object({ partnerId: z.string(), businessType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 创建合伙企业 NFT
      const partnership = await createPartnershipNFT(
        ctx.user.id,
        input.partnerId,
        input.businessType
      );
      
      return { partnershipId: partnership.id };
    }),
});
```

### 2.5 Phase 2 检查清单

- [ ] PropertyNFT 合约部署
- [ ] GameMarket 合约部署
- [ ] StakingPool 合约部署
- [ ] 交易市场前端实现
- [ ] 质押挖矿前端实现
- [ ] 社交系统实现
- [ ] 完整的端到端测试
- [ ] 用户验收测试（50+ 用户）

---

## Phase 3: 元宇宙扩展 (持续)

### 3.1 UGC 内容系统
- 玩家自建房屋设计
- 玩家创建商品
- 玩家创建任务

### 3.2 DAO 治理
- ISC 投票权
- 游戏更新投票
- 经济参数调整投票

### 3.3 跨链互通
- 支持多条公链
- 跨链资产转移
- 统一排行榜

---

## 技术栈总结

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React 19 + Tailwind 4 | Web3 钱包集成 |
| **游戏引擎** | Phaser 3 或 Babylon.js | 2D/3D 渲染 |
| **实时服务** | Colyseus | 多人同步 |
| **后端** | Express.js + tRPC | API 和业务逻辑 |
| **数据库** | MySQL/PostgreSQL | 玩家状态持久化 |
| **区块链** | Solidity (BSC) | 智能合约 |
| **钱包** | MetaMask + Web3.js | 链上交互 |

---

## 成本估计

| 项目 | 成本 | 说明 |
|------|------|------|
| **BSC 测试网部署** | 免费 | 测试用 |
| **BSC 主网部署** | ~$500 | 合约部署 gas |
| **服务器** | $1000/月 | Colyseus + 数据库 |
| **美术资源** | $5000-20000 | 角色、场景、UI |
| **安全审计** | $5000-10000 | 合约审计 |
| **市场营销** | 可选 | 社区建设 |

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|--------|
| **经济崩溃** | 中 | 高 | 严格的消耗 > 产出设计 |
| **链上拥堵** | 低 | 中 | 使用 L2 或其他链 |
| **合规问题** | 中 | 高 | 咨询法律专家 |
| **安全漏洞** | 低 | 高 | 第三方审计 + 保险 |
| **用户流失** | 中 | 高 | 持续的内容更新 |

---

## 下一步行动

1. **确认目标链和经济模型** - 与团队讨论
2. **启动 Phase 1 开发** - 预计 2-3 个月
3. **招募美术团队** - 并行进行
4. **建立社区** - Discord/Twitter 预热
5. **进行安全审计** - 主网上线前

---

## 参考资源

- FarmSim2800: https://github.com/UQdeco2800/farmsim
- Dwarfity-NFT: https://github.com/KennieHarold/dwarfity-nft
- Open-GameFi: https://github.com/yanis7774/Open-GameFi
- ConnexionContract: https://github.com/Connector-Gamefi/ConnexionContract
- ISC 合约: 已提供
