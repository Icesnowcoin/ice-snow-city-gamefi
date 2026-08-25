#!/bin/bash

# 修复所有 tRPC 路径的脚本
# 将 trpc.gameCore.* 替换为 trpc.game.core.*
# 将 trpc.game.player.* 保持不变
# 将 trpc.game.npc.* 保持不变

cd /home/ubuntu/ice_snow_city_agent

# 修复 GameScene.tsx
sed -i 's/trpc\.gameCore\.scene\./trpc.game.scene./g' client/src/components/game/GameScene.tsx
sed -i 's/trpc\.gameCore\.npc\./trpc.game.npc./g' client/src/components/game/GameScene.tsx

# 修复 GameEconomy.tsx
sed -i 's/trpc\.gameCore\.economy\./trpc.game.economy./g' client/src/components/game/GameEconomy.tsx

# 修复 GameTasks.tsx
sed -i 's/trpc\.gameCore\.task\./trpc.game.task./g' client/src/components/game/GameTasks.tsx

# 修复 GameProperty.tsx
sed -i 's/trpc\.gameCore\.npc\./trpc.game.npc./g' client/src/components/game/GameProperty.tsx

# 修复 GameFarm.tsx
sed -i 's/trpc\.gameCore\.npc\./trpc.game.npc./g' client/src/components/game/GameFarm.tsx

# 修复 GameShop.tsx
sed -i 's/trpc\.gameCore\.npc\./trpc.game.npc./g' client/src/components/game/GameShop.tsx

# 修复 GameSocial.tsx
sed -i 's/trpc\.gameCore\.npc\./trpc.game.npc./g' client/src/components/game/GameSocial.tsx

# 修复 useGameData.ts
sed -i 's/trpc\.game\.player\./trpc.game.player./g' client/src/hooks/useGameData.ts
sed -i 's/trpc\.game\.npc\./trpc.game.npc./g' client/src/hooks/useGameData.ts
sed -i 's/trpc\.game\.task\./trpc.game.task./g' client/src/hooks/useGameData.ts
sed -i 's/trpc\.game\.economy\./trpc.game.economy./g' client/src/hooks/useGameData.ts

echo "✅ tRPC 路径修复完成"
